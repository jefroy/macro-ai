from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.reminder import Reminder
from app.models.user import User

router = APIRouter(prefix="/reminders", tags=["reminders"])


class ReminderResponse(BaseModel):
    id: str
    type: str
    title: str
    description: str
    time: str
    days: list[str]
    enabled: bool


class CreateReminderRequest(BaseModel):
    type: str = "custom"
    title: str
    description: str = ""
    time: str = "08:00"
    days: list[str] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


class UpdateReminderRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    time: str | None = None
    days: list[str] | None = None
    type: str | None = None


def _reminder_response(r: Reminder) -> ReminderResponse:
    return ReminderResponse(
        id=str(r.id),
        type=r.type,
        title=r.title,
        description=r.description,
        time=r.time,
        days=r.days,
        enabled=r.enabled,
    )


@router.get("/", response_model=list[ReminderResponse])
async def list_reminders(user: User = Depends(get_current_user)):
    reminders = await Reminder.find(
        Reminder.user_id == str(user.id),
    ).sort("+time").to_list()
    return [_reminder_response(r) for r in reminders]


@router.post("/", response_model=ReminderResponse, status_code=201)
async def create_reminder(
    data: CreateReminderRequest,
    user: User = Depends(get_current_user),
):
    reminder = Reminder(
        user_id=str(user.id),
        type=data.type,
        title=data.title,
        description=data.description,
        time=data.time,
        days=data.days,
    )
    await reminder.insert()
    return _reminder_response(reminder)


@router.patch("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: str,
    data: UpdateReminderRequest,
    user: User = Depends(get_current_user),
):
    reminder = await Reminder.get(reminder_id)
    if not reminder or reminder.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Reminder not found")

    update_data = data.model_dump(exclude_none=True)
    if update_data:
        for key, value in update_data.items():
            setattr(reminder, key, value)
        await reminder.save()

    return _reminder_response(reminder)


@router.patch("/{reminder_id}/toggle", response_model=ReminderResponse)
async def toggle_reminder(
    reminder_id: str,
    user: User = Depends(get_current_user),
):
    reminder = await Reminder.get(reminder_id)
    if not reminder or reminder.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder.enabled = not reminder.enabled
    await reminder.save()
    return _reminder_response(reminder)


@router.delete("/{reminder_id}", status_code=204)
async def delete_reminder(
    reminder_id: str,
    user: User = Depends(get_current_user),
):
    reminder = await Reminder.get(reminder_id)
    if not reminder or reminder.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Reminder not found")
    await reminder.delete()
