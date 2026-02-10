"""TDEE (Total Daily Energy Expenditure) calculation using Mifflin-St Jeor."""

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}


def calculate_bmr(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
) -> float:
    """Mifflin-St Jeor BMR formula."""
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age
    if gender == "male":
        bmr += 5
    else:
        bmr -= 161
    return bmr


def calculate_tdee(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str,
) -> int:
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
    return round(bmr * multiplier)


def suggest_targets(
    tdee: int,
    goal: str = "maintain",
    weight_kg: float = 70,
) -> dict:
    """Suggest macro targets based on TDEE and goal.

    Goals: 'cut' (-500 kcal), 'maintain', 'bulk' (+300 kcal).
    Protein: 2.0 g/kg for cut, 1.8 g/kg for maintain, 1.6 g/kg for bulk.
    Fat: 25% of calories. Carbs: remainder.
    """
    adjustments = {"cut": -500, "maintain": 0, "bulk": 300}
    calories = tdee + adjustments.get(goal, 0)

    protein_per_kg = {"cut": 2.0, "maintain": 1.8, "bulk": 1.6}
    protein_g = round(weight_kg * protein_per_kg.get(goal, 1.8))

    fat_calories = calories * 0.25
    fat_g = round(fat_calories / 9)

    remaining_calories = calories - (protein_g * 4) - (fat_g * 9)
    carbs_g = round(max(remaining_calories, 0) / 4)

    return {
        "calories": max(calories, 1200),
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fat_g": fat_g,
        "fiber_g": 30,
    }
