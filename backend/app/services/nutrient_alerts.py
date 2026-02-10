from dataclasses import dataclass
from datetime import date

from app.models.food_log import FoodLog


@dataclass
class NutrientAlert:
    nutrient: str
    label: str
    current: float
    limit: float
    unit: str
    severity: str  # "warning" or "info"
    direction: str  # "over" or "under"


# Daily upper limits (general guidelines)
UPPER_LIMITS = {
    "sodium_mg": {"label": "Sodium", "limit": 2300, "unit": "mg"},
    "sugar_g": {"label": "Sugar", "limit": 50, "unit": "g"},
    "saturated_fat_g": {"label": "Saturated Fat", "limit": 20, "unit": "g"},
}

# Daily lower limits (minimums to hit)
LOWER_LIMITS = {
    "fiber_g": {"label": "Fiber", "limit": 25, "unit": "g"},
    "protein_g": {"label": "Protein", "limit": 0, "unit": "g"},  # 0 = uses user target
}


async def check_nutrient_alerts(
    user_id: str,
    target_date: date | None = None,
    protein_target: float = 0,
) -> list[dict]:
    """Check daily totals against nutrient limits and return alerts."""
    target_date = target_date or date.today()
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date == target_date,
    ).to_list()

    if not entries:
        return []

    totals = {
        "calories": sum(e.calories for e in entries),
        "protein_g": sum(e.protein_g for e in entries),
        "carbs_g": sum(e.carbs_g for e in entries),
        "fat_g": sum(e.fat_g for e in entries),
        "fiber_g": sum(e.fiber_g for e in entries),
        "sugar_g": sum(e.sugar_g for e in entries),
        "sodium_mg": sum(e.sodium_mg for e in entries),
        "saturated_fat_g": sum(e.saturated_fat_g for e in entries),
    }

    alerts: list[dict] = []

    # Check upper limits
    for field, cfg in UPPER_LIMITS.items():
        current = totals.get(field, 0)
        limit = cfg["limit"]
        if current > limit:
            alerts.append({
                "nutrient": field,
                "label": cfg["label"],
                "current": round(current, 1),
                "limit": limit,
                "unit": cfg["unit"],
                "severity": "warning",
                "direction": "over",
                "message": f"{cfg['label']} is at {current:.0f}{cfg['unit']} — over the {limit}{cfg['unit']} daily limit",
            })
        elif current > limit * 0.8:
            alerts.append({
                "nutrient": field,
                "label": cfg["label"],
                "current": round(current, 1),
                "limit": limit,
                "unit": cfg["unit"],
                "severity": "info",
                "direction": "over",
                "message": f"{cfg['label']} is at {current:.0f}{cfg['unit']} — approaching the {limit}{cfg['unit']} daily limit",
            })

    # Check fiber (under limit)
    fiber = totals.get("fiber_g", 0)
    fiber_limit = LOWER_LIMITS["fiber_g"]["limit"]
    if fiber < fiber_limit * 0.5 and len(entries) >= 2:
        alerts.append({
            "nutrient": "fiber_g",
            "label": "Fiber",
            "current": round(fiber, 1),
            "limit": fiber_limit,
            "unit": "g",
            "severity": "info",
            "direction": "under",
            "message": f"Fiber is at {fiber:.0f}g — aim for at least {fiber_limit}g daily",
        })

    # Check protein vs target (if provided)
    if protein_target > 0:
        protein = totals.get("protein_g", 0)
        if protein < protein_target * 0.5 and len(entries) >= 2:
            alerts.append({
                "nutrient": "protein_g",
                "label": "Protein",
                "current": round(protein, 1),
                "limit": protein_target,
                "unit": "g",
                "severity": "info",
                "direction": "under",
                "message": f"Protein is at {protein:.0f}g — target is {protein_target:.0f}g",
            })

    return alerts
