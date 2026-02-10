from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.food_log import FoodLog
from app.models.user import User
from app.services.daily_insights import generate_daily_insights
from app.services.nutrient_alerts import check_nutrient_alerts

router = APIRouter(prefix="/food-log", tags=["food-log"])


class FoodLogEntry(BaseModel):
    id: str
    date: date
    meal: str
    food_id: str | None
    food_name: str
    serving_label: str
    quantity: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    saturated_fat_g: float


class DailyTotals(BaseModel):
    date: date
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    saturated_fat_g: float
    entry_count: int


def _entry_response(entry: FoodLog) -> FoodLogEntry:
    return FoodLogEntry(
        id=str(entry.id),
        date=entry.date,
        meal=entry.meal,
        food_id=entry.food_id,
        food_name=entry.food_name,
        serving_label=entry.serving_label,
        quantity=entry.quantity,
        calories=entry.calories,
        protein_g=entry.protein_g,
        carbs_g=entry.carbs_g,
        fat_g=entry.fat_g,
        fiber_g=entry.fiber_g,
        sugar_g=entry.sugar_g,
        sodium_mg=entry.sodium_mg,
        saturated_fat_g=entry.saturated_fat_g,
    )


class LogFoodRequest(BaseModel):
    food_id: str | None = None
    food_name: str
    meal: str = "snack"
    serving_label: str = "1 serving"
    quantity: float = 1.0
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0
    saturated_fat_g: float = 0
    date: date | None = None


@router.post("/", response_model=FoodLogEntry, status_code=201)
async def log_food(
    data: LogFoodRequest,
    user: User = Depends(get_current_user),
):
    entry = FoodLog(
        user_id=str(user.id),
        date=data.date or date.today(),
        meal=data.meal,
        food_id=data.food_id,
        food_name=data.food_name,
        serving_label=data.serving_label,
        quantity=data.quantity,
        calories=data.calories,
        protein_g=data.protein_g,
        carbs_g=data.carbs_g,
        fat_g=data.fat_g,
        fiber_g=data.fiber_g,
        sugar_g=data.sugar_g,
        sodium_mg=data.sodium_mg,
        saturated_fat_g=data.saturated_fat_g,
    )
    await entry.insert()
    return _entry_response(entry)


@router.get("/", response_model=list[FoodLogEntry])
async def get_entries(
    target_date: date = Query(default_factory=date.today),
    user: User = Depends(get_current_user),
):
    entries = await FoodLog.find(
        FoodLog.user_id == str(user.id),
        FoodLog.date == target_date,
    ).sort("+meal", "+created_at").to_list()
    return [_entry_response(e) for e in entries]


@router.get("/totals", response_model=DailyTotals)
async def get_daily_totals(
    target_date: date = Query(default_factory=date.today),
    user: User = Depends(get_current_user),
):
    entries = await FoodLog.find(
        FoodLog.user_id == str(user.id),
        FoodLog.date == target_date,
    ).to_list()

    totals = DailyTotals(
        date=target_date,
        calories=sum(e.calories for e in entries),
        protein_g=sum(e.protein_g for e in entries),
        carbs_g=sum(e.carbs_g for e in entries),
        fat_g=sum(e.fat_g for e in entries),
        fiber_g=sum(e.fiber_g for e in entries),
        sugar_g=sum(e.sugar_g for e in entries),
        sodium_mg=sum(e.sodium_mg for e in entries),
        saturated_fat_g=sum(e.saturated_fat_g for e in entries),
        entry_count=len(entries),
    )
    return totals


@router.get("/range", response_model=list[DailyTotals])
async def get_range_totals(
    start: date = Query(...),
    end: date = Query(default_factory=date.today),
    user: User = Depends(get_current_user),
):
    """Get daily totals for a date range (for charts)."""
    entries = await FoodLog.find(
        FoodLog.user_id == str(user.id),
        FoodLog.date >= start,
        FoodLog.date <= end,
    ).to_list()

    # Group by date
    daily: dict[date, list[FoodLog]] = {}
    for e in entries:
        daily.setdefault(e.date, []).append(e)

    result = []
    for d in sorted(daily.keys()):
        day_entries = daily[d]
        result.append(
            DailyTotals(
                date=d,
                calories=sum(e.calories for e in day_entries),
                protein_g=sum(e.protein_g for e in day_entries),
                carbs_g=sum(e.carbs_g for e in day_entries),
                fat_g=sum(e.fat_g for e in day_entries),
                fiber_g=sum(e.fiber_g for e in day_entries),
                sugar_g=sum(e.sugar_g for e in day_entries),
                sodium_mg=sum(e.sodium_mg for e in day_entries),
                saturated_fat_g=sum(e.saturated_fat_g for e in day_entries),
                entry_count=len(day_entries),
            )
        )
    return result


@router.get("/insights")
async def get_insights(
    target_date: date = Query(default_factory=date.today),
    user: User = Depends(get_current_user),
):
    """Get rule-based daily insights comparing intake to targets."""
    return await generate_daily_insights(str(user.id), target_date)


@router.get("/alerts")
async def get_alerts(
    target_date: date = Query(default_factory=date.today),
    user: User = Depends(get_current_user),
):
    """Get nutrient alerts for the day based on intake limits."""
    protein_target = user.targets.protein_g if user.targets else 0
    alerts = await check_nutrient_alerts(
        user_id=str(user.id),
        target_date=target_date,
        protein_target=protein_target,
    )
    return alerts


class CopyMealRequest(BaseModel):
    source_date: date
    source_meal: str
    target_date: date
    target_meal: str


class CopyMealResponse(BaseModel):
    copied: int
    entries: list[FoodLogEntry]


@router.post("/copy", response_model=CopyMealResponse, status_code=201)
async def copy_meal(
    data: CopyMealRequest,
    user: User = Depends(get_current_user),
):
    """Copy all food entries from one meal to another date/meal."""
    user_id = str(user.id)
    source_entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date == data.source_date,
        FoodLog.meal == data.source_meal,
    ).to_list()

    if not source_entries:
        raise HTTPException(status_code=404, detail="No entries found for that meal")

    new_entries = []
    for src in source_entries:
        entry = FoodLog(
            user_id=user_id,
            date=data.target_date,
            meal=data.target_meal,
            food_id=src.food_id,
            food_name=src.food_name,
            serving_label=src.serving_label,
            quantity=src.quantity,
            calories=src.calories,
            protein_g=src.protein_g,
            carbs_g=src.carbs_g,
            fat_g=src.fat_g,
            fiber_g=src.fiber_g,
            sugar_g=src.sugar_g,
            sodium_mg=src.sodium_mg,
            saturated_fat_g=src.saturated_fat_g,
        )
        await entry.insert()
        new_entries.append(entry)

    return CopyMealResponse(
        copied=len(new_entries),
        entries=[_entry_response(e) for e in new_entries],
    )


@router.delete("/{entry_id}", status_code=204)
async def delete_entry(
    entry_id: str,
    user: User = Depends(get_current_user),
):
    entry = await FoodLog.get(entry_id)
    if not entry or entry.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Entry not found")
    await entry.delete()
