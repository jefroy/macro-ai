from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User
from app.models.weight import Weight

router = APIRouter(prefix="/weight", tags=["weight"])


class WeightEntry(BaseModel):
    id: str
    date: date
    weight_kg: float
    note: str


class LogWeightRequest(BaseModel):
    date: date | None = None
    weight_kg: float
    note: str = ""


class WeightTrend(BaseModel):
    entries: list[WeightEntry]
    rolling_avg_7d: float | None
    change_30d: float | None


def _entry_response(entry: Weight) -> WeightEntry:
    return WeightEntry(
        id=str(entry.id),
        date=entry.date,
        weight_kg=entry.weight_kg,
        note=entry.note,
    )


@router.post("/", response_model=WeightEntry, status_code=201)
async def log_weight(
    data: LogWeightRequest,
    user: User = Depends(get_current_user),
):
    target_date = data.date or date.today()

    # Upsert: replace existing entry for the same date
    existing = await Weight.find_one(
        Weight.user_id == str(user.id),
        Weight.date == target_date,
    )
    if existing:
        existing.weight_kg = data.weight_kg
        existing.note = data.note
        await existing.save()
        return _entry_response(existing)

    entry = Weight(
        user_id=str(user.id),
        date=target_date,
        weight_kg=data.weight_kg,
        note=data.note,
    )
    await entry.insert()
    return _entry_response(entry)


@router.get("/", response_model=list[WeightEntry])
async def get_entries(
    days: int = Query(default=30, ge=7, le=365),
    user: User = Depends(get_current_user),
):
    cutoff = date.today() - timedelta(days=days)
    entries = await Weight.find(
        Weight.user_id == str(user.id),
        Weight.date >= cutoff,
    ).sort("+date").to_list()
    return [_entry_response(e) for e in entries]


@router.get("/trend", response_model=WeightTrend)
async def get_trend(
    days: int = Query(default=30, ge=7, le=365),
    user: User = Depends(get_current_user),
):
    cutoff = date.today() - timedelta(days=days)
    entries = await Weight.find(
        Weight.user_id == str(user.id),
        Weight.date >= cutoff,
    ).sort("+date").to_list()

    entry_list = [_entry_response(e) for e in entries]

    # 7-day rolling average
    rolling_avg = None
    week_ago = date.today() - timedelta(days=7)
    recent = [e for e in entries if e.date >= week_ago]
    if recent:
        rolling_avg = round(sum(e.weight_kg for e in recent) / len(recent), 1)

    # 30-day change
    change = None
    if len(entries) >= 2:
        change = round(entries[-1].weight_kg - entries[0].weight_kg, 1)

    return WeightTrend(
        entries=entry_list,
        rolling_avg_7d=rolling_avg,
        change_30d=change,
    )


@router.delete("/{entry_id}", status_code=204)
async def delete_entry(
    entry_id: str,
    user: User = Depends(get_current_user),
):
    entry = await Weight.get(entry_id)
    if not entry or entry.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Entry not found")
    await entry.delete()
