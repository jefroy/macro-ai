from datetime import date

from app.models.food_log import FoodLog
from app.models.user import User


async def generate_daily_insights(user_id: str, target_date: date | None = None) -> list[dict]:
    """Generate rule-based daily insights comparing intake to targets."""
    target_date = target_date or date.today()

    user = await User.get(user_id)
    if not user or not user.targets:
        return []

    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date == target_date,
    ).to_list()

    if not entries:
        return [{"type": "info", "message": "No food logged yet today. Start tracking to see insights."}]

    targets = user.targets
    cal = sum(e.calories for e in entries)
    protein = sum(e.protein_g for e in entries)
    carbs = sum(e.carbs_g for e in entries)
    fat = sum(e.fat_g for e in entries)
    fiber = sum(e.fiber_g for e in entries)
    entry_count = len(entries)

    insights: list[dict] = []

    # Calorie pacing
    cal_pct = cal / targets.calories * 100 if targets.calories > 0 else 0
    if cal_pct >= 95:
        insights.append({
            "type": "success",
            "message": f"You've hit your calorie target — {cal:.0f}/{targets.calories} kcal.",
        })
    elif cal_pct >= 75:
        remaining = targets.calories - cal
        insights.append({
            "type": "info",
            "message": f"Almost there — {remaining:.0f} kcal remaining to hit your target.",
        })

    # Protein check
    if targets.protein_g > 0:
        p_pct = protein / targets.protein_g * 100
        if p_pct >= 100:
            insights.append({
                "type": "success",
                "message": f"Protein target hit — {protein:.0f}g/{targets.protein_g}g.",
            })
        elif p_pct < 50 and entry_count >= 2:
            insights.append({
                "type": "warning",
                "message": f"Protein is low at {protein:.0f}g — you need {targets.protein_g - protein:.0f}g more to hit your target.",
            })

    # Fiber encouragement
    if fiber < 10 and entry_count >= 2:
        insights.append({
            "type": "info",
            "message": f"Fiber is at {fiber:.0f}g — add some vegetables, beans, or whole grains to reach 25g.",
        })

    # Over-eating warning
    if cal_pct > 110:
        over = cal - targets.calories
        insights.append({
            "type": "warning",
            "message": f"You're {over:.0f} kcal over your daily target.",
        })

    # Meal balance
    meals = set(e.meal for e in entries)
    if len(meals) == 1 and entry_count >= 3:
        insights.append({
            "type": "info",
            "message": "All entries are in one meal — spreading meals throughout the day helps with energy and satiety.",
        })

    # Fat ratio check
    if targets.fat_g > 0 and fat / targets.fat_g > 1.2 and entry_count >= 2:
        insights.append({
            "type": "info",
            "message": f"Fat intake is high at {fat:.0f}g vs {targets.fat_g}g target. Consider leaner options for remaining meals.",
        })

    if not insights:
        insights.append({
            "type": "info",
            "message": f"On track — {cal:.0f}/{targets.calories} kcal, {protein:.0f}g protein logged across {entry_count} entries.",
        })

    return insights
