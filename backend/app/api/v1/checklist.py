from datetime import date as DateType

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.checklist import ChecklistItem
from app.models.food_log import FoodLog
from app.models.user import User

router = APIRouter(prefix="/checklist", tags=["checklist"])


class ChecklistItemResponse(BaseModel):
    id: str
    date: DateType
    title: str
    type: str
    checked: bool
    auto_check_field: str
    auto_check_target: float


class CreateChecklistItemRequest(BaseModel):
    title: str


def _item_response(item: ChecklistItem) -> ChecklistItemResponse:
    return ChecklistItemResponse(
        id=str(item.id),
        date=item.date,
        title=item.title,
        type=item.type,
        checked=item.checked,
        auto_check_field=item.auto_check_field,
        auto_check_target=item.auto_check_target,
    )


# Default auto-check items generated from user targets
def _build_default_items(user: User, target_date: DateType) -> list[dict]:
    items = []
    t = user.targets
    if t:
        if t.calories > 0:
            items.append({
                "title": f"Hit calorie target ({t.calories} kcal)",
                "auto_check_field": "calories",
                "auto_check_target": t.calories * 0.9,  # 90% threshold
            })
        if t.protein_g > 0:
            items.append({
                "title": f"Hit protein target ({t.protein_g}g)",
                "auto_check_field": "protein_g",
                "auto_check_target": t.protein_g * 0.9,
            })
    # Always include these
    items.append({
        "title": "Log at least 3 meals",
        "auto_check_field": "entry_count",
        "auto_check_target": 3,
    })
    items.append({
        "title": "Get 25g+ fiber",
        "auto_check_field": "fiber_g",
        "auto_check_target": 25,
    })
    return items


async def _auto_check_items(
    items: list[ChecklistItem], user_id: str, target_date: DateType
) -> list[ChecklistItem]:
    """Update auto-check items based on current food log data."""
    auto_items = [i for i in items if i.type == "auto" and i.auto_check_field]
    if not auto_items:
        return items

    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date == target_date,
    ).to_list()

    totals = {
        "calories": sum(e.calories for e in entries),
        "protein_g": sum(e.protein_g for e in entries),
        "carbs_g": sum(e.carbs_g for e in entries),
        "fat_g": sum(e.fat_g for e in entries),
        "fiber_g": sum(e.fiber_g for e in entries),
        "sugar_g": sum(e.sugar_g for e in entries),
        "sodium_mg": sum(e.sodium_mg for e in entries),
        "entry_count": len(entries),
    }

    changed = False
    for item in auto_items:
        current = totals.get(item.auto_check_field, 0)
        should_check = current >= item.auto_check_target
        if should_check != item.checked:
            item.checked = should_check
            await item.save()
            changed = True

    return items


@router.get("/", response_model=list[ChecklistItemResponse])
async def get_checklist(
    target_date: DateType = Query(default_factory=DateType.today),
    user: User = Depends(get_current_user),
):
    user_id = str(user.id)

    # Get existing items for this date
    items = await ChecklistItem.find(
        ChecklistItem.user_id == user_id,
        ChecklistItem.date == target_date,
    ).sort("+created_at").to_list()

    # If no items exist for today, generate defaults
    if not items:
        defaults = _build_default_items(user, target_date)
        for d in defaults:
            item = ChecklistItem(
                user_id=user_id,
                date=target_date,
                title=d["title"],
                type="auto",
                auto_check_field=d["auto_check_field"],
                auto_check_target=d["auto_check_target"],
            )
            await item.insert()
            items.append(item)

    # Run auto-check
    items = await _auto_check_items(items, user_id, target_date)

    return [_item_response(i) for i in items]


@router.patch("/{item_id}/toggle", response_model=ChecklistItemResponse)
async def toggle_checklist_item(
    item_id: str,
    user: User = Depends(get_current_user),
):
    item = await ChecklistItem.get(item_id)
    if not item or item.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Item not found")

    # Only allow manual toggle for custom items (auto items are managed by the system)
    if item.type == "auto":
        raise HTTPException(status_code=400, detail="Auto-check items are managed automatically")

    item.checked = not item.checked
    await item.save()
    return _item_response(item)


@router.post("/", response_model=ChecklistItemResponse, status_code=201)
async def add_checklist_item(
    data: CreateChecklistItemRequest,
    target_date: DateType = Query(default_factory=DateType.today),
    user: User = Depends(get_current_user),
):
    item = ChecklistItem(
        user_id=str(user.id),
        date=target_date,
        title=data.title,
        type="custom",
    )
    await item.insert()
    return _item_response(item)


@router.delete("/{item_id}", status_code=204)
async def delete_checklist_item(
    item_id: str,
    user: User = Depends(get_current_user),
):
    item = await ChecklistItem.get(item_id)
    if not item or item.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Item not found")
    if item.type == "auto":
        raise HTTPException(status_code=400, detail="Cannot delete auto-check items")
    await item.delete()


class ChecklistSummary(BaseModel):
    date: DateType
    total: int
    checked: int
    completion: float


@router.get("/streak", response_model=dict)
async def get_streak(user: User = Depends(get_current_user)):
    """Get the user's current checklist completion streak (consecutive days >= 80% complete)."""
    user_id = str(user.id)
    today = DateType.today()
    streak = 0

    # Walk backwards from yesterday (today might not be complete yet)
    from datetime import timedelta
    check_date = today - timedelta(days=1)

    for _ in range(365):  # max 1 year lookback
        items = await ChecklistItem.find(
            ChecklistItem.user_id == user_id,
            ChecklistItem.date == check_date,
        ).to_list()

        if not items:
            break

        checked = sum(1 for i in items if i.checked)
        completion = checked / len(items) if items else 0

        if completion >= 0.8:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Check if today also qualifies
    today_items = await ChecklistItem.find(
        ChecklistItem.user_id == user_id,
        ChecklistItem.date == today,
    ).to_list()
    today_completion = 0
    if today_items:
        today_checked = sum(1 for i in today_items if i.checked)
        today_completion = today_checked / len(today_items)

    return {
        "streak": streak,
        "today_completion": round(today_completion, 2),
        "streak_includes_today": today_completion >= 0.8,
    }
