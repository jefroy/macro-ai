import csv
import io
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.food_log import FoodLog
from app.models.user import User
from app.models.weight import Weight

router = APIRouter(prefix="/reports", tags=["reports"])


class DayReport(BaseModel):
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


class WeeklyReport(BaseModel):
    start_date: date
    end_date: date
    days_logged: int
    daily_breakdown: list[DayReport]
    averages: dict[str, float]
    vs_targets: dict[str, dict]
    highlights: list[dict]
    weight_change: float | None


@router.get("/weekly", response_model=WeeklyReport)
async def get_weekly_report(
    end_date: date = Query(default_factory=date.today),
    user: User = Depends(get_current_user),
):
    """Generate a comprehensive weekly nutrition report."""
    user_id = str(user.id)
    start_date = end_date - timedelta(days=6)

    # Fetch all food logs for the week
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date >= start_date,
        FoodLog.date <= end_date,
    ).to_list()

    # Group by date
    daily: dict[date, list[FoodLog]] = {}
    for e in entries:
        daily.setdefault(e.date, []).append(e)

    nutrient_keys = ["calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg", "saturated_fat_g"]

    # Build daily breakdown
    daily_breakdown = []
    for d in range(7):
        day = start_date + timedelta(days=d)
        day_entries = daily.get(day, [])
        report = DayReport(
            date=day,
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
        daily_breakdown.append(report)

    # Calculate averages (only days with entries)
    logged_days = [d for d in daily_breakdown if d.entry_count > 0]
    n = len(logged_days) or 1
    averages = {}
    for key in nutrient_keys:
        averages[key] = round(sum(getattr(d, key) for d in logged_days) / n, 1)

    # Compare to targets
    vs_targets = {}
    if user.targets:
        target_map = {
            "calories": user.targets.calories,
            "protein_g": user.targets.protein_g,
            "carbs_g": user.targets.carbs_g,
            "fat_g": user.targets.fat_g,
        }
        for key, target in target_map.items():
            if target > 0:
                avg = averages.get(key, 0)
                vs_targets[key] = {
                    "average": avg,
                    "target": target,
                    "percent": round(avg / target * 100, 1),
                    "status": "on_track" if 90 <= avg / target * 100 <= 110 else (
                        "under" if avg / target * 100 < 90 else "over"
                    ),
                }

    # Generate highlights
    highlights = []
    if len(logged_days) == 7:
        highlights.append({"type": "success", "message": "Logged food every day this week."})
    elif len(logged_days) >= 5:
        highlights.append({"type": "info", "message": f"Logged {len(logged_days)}/7 days this week."})
    elif len(logged_days) > 0:
        highlights.append({"type": "warning", "message": f"Only logged {len(logged_days)}/7 days — consistency helps accuracy."})

    # Protein hit rate
    if user.targets and user.targets.protein_g > 0:
        protein_hits = sum(1 for d in logged_days if d.protein_g >= user.targets.protein_g * 0.9)
        if protein_hits == len(logged_days) and len(logged_days) > 0:
            highlights.append({"type": "success", "message": "Hit protein target every logged day."})
        elif len(logged_days) > 0:
            highlights.append({"type": "info", "message": f"Hit protein target {protein_hits}/{len(logged_days)} days."})

    # Sodium check
    high_sodium_days = sum(1 for d in logged_days if d.sodium_mg > 2300)
    if high_sodium_days > 0:
        highlights.append({"type": "warning", "message": f"Sodium exceeded 2300mg on {high_sodium_days} day(s)."})

    # Sugar check
    high_sugar_days = sum(1 for d in logged_days if d.sugar_g > 50)
    if high_sugar_days > 0:
        highlights.append({"type": "warning", "message": f"Sugar exceeded 50g on {high_sugar_days} day(s)."})

    # Weight change
    weight_change = None
    weights = await Weight.find(
        Weight.user_id == user_id,
        Weight.date >= start_date,
        Weight.date <= end_date,
    ).sort("+date").to_list()
    if len(weights) >= 2:
        weight_change = round(weights[-1].weight_kg - weights[0].weight_kg, 2)
        direction = "lost" if weight_change < 0 else "gained"
        highlights.append({
            "type": "info",
            "message": f"Weight: {direction} {abs(weight_change)} kg this week.",
        })

    return WeeklyReport(
        start_date=start_date,
        end_date=end_date,
        days_logged=len(logged_days),
        daily_breakdown=daily_breakdown,
        averages=averages,
        vs_targets=vs_targets,
        highlights=highlights,
        weight_change=weight_change,
    )


@router.get("/export")
async def export_food_log(
    start: date = Query(...),
    end: date = Query(default_factory=date.today),
    format: str = Query("csv"),
    user: User = Depends(get_current_user),
):
    """Export food log data as CSV."""
    user_id = str(user.id)
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date >= start,
        FoodLog.date <= end,
    ).sort("+date", "+meal", "+created_at").to_list()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Date", "Meal", "Food", "Serving", "Quantity",
        "Calories", "Protein (g)", "Carbs (g)", "Fat (g)",
        "Fiber (g)", "Sugar (g)", "Sodium (mg)", "Saturated Fat (g)",
    ])

    for e in entries:
        writer.writerow([
            e.date.isoformat(),
            e.meal,
            e.food_name,
            e.serving_label,
            e.quantity,
            round(e.calories, 1),
            round(e.protein_g, 1),
            round(e.carbs_g, 1),
            round(e.fat_g, 1),
            round(e.fiber_g, 1),
            round(e.sugar_g, 1),
            round(e.sodium_mg, 1),
            round(e.saturated_fat_g, 1),
        ])

    output.seek(0)
    filename = f"macroai_food_log_{start}_{end}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
