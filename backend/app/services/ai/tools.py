from datetime import date, timedelta

from langchain_core.tools import tool

from app.models.food import Food
from app.models.food_log import FoodLog
from app.models.user import User
from app.models.weight import Weight
from app.services.nutrient_alerts import check_nutrient_alerts


# ── Read Tools ──────────────────────────────────────────────


@tool
async def get_user_profile(user_id: str) -> str:
    """Get the user's profile: age, height, weight, gender, activity level, and daily macro targets."""
    user = await User.get(user_id)
    p = user.profile
    t = user.targets
    return (
        f"Age: {p.age}, Gender: {p.gender}, Height: {p.height_cm}cm, "
        f"Weight: {p.weight_kg}kg, Activity: {p.activity_level}\n"
        f"Daily targets — Calories: {t.calories}, Protein: {t.protein_g}g, "
        f"Carbs: {t.carbs_g}g, Fat: {t.fat_g}g, Fiber: {t.fiber_g}g"
    )


@tool
async def get_todays_food_log(user_id: str) -> str:
    """Get all food entries logged today, grouped by meal."""
    today = date.today()
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date == today,
    ).sort("+meal", "+created_at").to_list()

    if not entries:
        return "No food logged today."

    lines = []
    for e in entries:
        lines.append(
            f"- [{e.meal}] {e.food_name}: {e.calories:.0f} kcal, "
            f"{e.protein_g:.0f}g P, {e.carbs_g:.0f}g C, {e.fat_g:.0f}g F"
        )
    return "\n".join(lines)


@tool
async def get_daily_totals(user_id: str, date_str: str = "") -> str:
    """Get total calories and macros for a given date (YYYY-MM-DD). Defaults to today."""
    target_date = date.fromisoformat(date_str) if date_str else date.today()
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date == target_date,
    ).to_list()

    keys = ["calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg", "saturated_fat_g"]
    totals = {k: 0.0 for k in keys}
    for e in entries:
        for k in keys:
            totals[k] += getattr(e, k)

    return (
        f"Totals for {target_date}: {totals['calories']:.0f} kcal, "
        f"{totals['protein_g']:.0f}g protein, {totals['carbs_g']:.0f}g carbs, "
        f"{totals['fat_g']:.0f}g fat, {totals['fiber_g']:.0f}g fiber, "
        f"{totals['sugar_g']:.0f}g sugar, {totals['sodium_mg']:.0f}mg sodium, "
        f"{totals['saturated_fat_g']:.0f}g saturated fat"
    )


@tool
async def get_weekly_averages(user_id: str) -> str:
    """Get average daily calories and macros over the past 7 days."""
    today = date.today()
    week_ago = today - timedelta(days=7)
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date >= week_ago,
        FoodLog.date <= today,
    ).to_list()

    if not entries:
        return "No data for the past 7 days."

    daily: dict[date, dict] = {}
    for e in entries:
        d = daily.setdefault(e.date, {"cal": 0, "p": 0, "c": 0, "f": 0})
        d["cal"] += e.calories
        d["p"] += e.protein_g
        d["c"] += e.carbs_g
        d["f"] += e.fat_g

    n = len(daily)
    avg_cal = sum(d["cal"] for d in daily.values()) / n
    avg_p = sum(d["p"] for d in daily.values()) / n
    avg_c = sum(d["c"] for d in daily.values()) / n
    avg_f = sum(d["f"] for d in daily.values()) / n

    return (
        f"7-day averages ({n} days logged): {avg_cal:.0f} kcal, "
        f"{avg_p:.0f}g protein, {avg_c:.0f}g carbs, {avg_f:.0f}g fat"
    )


@tool
async def search_food_database(user_id: str, query: str, limit: int = 10) -> str:
    """Search the food database by name. Returns matching foods with macros per serving. Favorites are marked with [FAVORITE]."""
    foods = await Food.find(
        {"$text": {"$search": query}},
        limit=limit,
    ).to_list()

    if not foods:
        return f"No foods found matching '{query}'."

    # Check user favorites
    user = await User.get(user_id)
    fav_ids = set(user.favorite_foods) if user else set()

    lines = []
    for f in foods:
        fav_marker = " [FAVORITE]" if str(f.id) in fav_ids else ""
        lines.append(
            f"- {f.name}{fav_marker} (per {f.serving.label}): "
            f"{f.calories:.0f} kcal, {f.protein_g:.0f}g P, "
            f"{f.carbs_g:.0f}g C, {f.fat_g:.0f}g F, "
            f"{f.fiber_g:.0f}g fiber, {f.sugar_g:.0f}g sugar, "
            f"{f.sodium_mg:.0f}mg sodium, {f.saturated_fat_g:.0f}g sat fat"
        )
    return "\n".join(lines)


@tool
async def get_weight_trend(user_id: str, days: int = 14) -> str:
    """Get recent weight entries and trend over the specified number of days."""
    cutoff = date.today() - timedelta(days=days)
    weights = await Weight.find(
        Weight.user_id == user_id,
        Weight.date >= cutoff,
    ).sort("+date").to_list()

    if not weights:
        return "No weight entries found."

    lines = [f"- {w.date}: {w.weight_kg:.1f} kg" for w in weights]
    if len(weights) >= 2:
        diff = weights[-1].weight_kg - weights[0].weight_kg
        direction = "up" if diff > 0 else "down"
        lines.append(f"Trend: {direction} {abs(diff):.1f} kg over {days} days")

    return "\n".join(lines)


# ── Write Tools ─────────────────────────────────────────────


@tool
async def log_food(
    user_id: str,
    food_name: str,
    meal: str,
    calories: float,
    protein_g: float,
    carbs_g: float,
    fat_g: float,
    serving_label: str = "1 serving",
    quantity: float = 1.0,
    fiber_g: float = 0,
    sugar_g: float = 0,
    sodium_mg: float = 0,
    saturated_fat_g: float = 0,
) -> str:
    """Log a food entry for the user. Meal must be: breakfast, lunch, dinner, or snack. Include fiber, sugar, sodium, and saturated fat when known."""
    entry = FoodLog(
        user_id=user_id,
        date=date.today(),
        food_name=food_name,
        meal=meal,
        serving_label=serving_label,
        quantity=quantity,
        calories=calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        fiber_g=fiber_g,
        sugar_g=sugar_g,
        sodium_mg=sodium_mg,
        saturated_fat_g=saturated_fat_g,
    )
    await entry.insert()
    return f"Logged: {food_name} ({meal}) — {calories:.0f} kcal"


@tool
async def quick_log(
    user_id: str,
    description: str,
    meal: str = "snack",
) -> str:
    """Log food from a natural language description like '200g chicken breast' or '2 eggs'.
    Searches the food database, calculates macros from the quantity, and logs it.
    Meal must be: breakfast, lunch, dinner, or snack.
    If the food is not found in the database, return an error — do not guess macros."""
    import re

    # Parse quantity and unit from description
    # Patterns: "200g chicken breast", "2 eggs", "1 cup oats", "chicken breast 150g"
    qty_pattern = r"(\d+(?:\.\d+)?)\s*(g|kg|ml|oz|cups?|tbsp|tsp|serving|servings)?\s+"
    match = re.match(qty_pattern, description.strip(), re.IGNORECASE)

    if match:
        amount = float(match.group(1))
        unit = (match.group(2) or "g").lower().rstrip("s")
        food_query = description[match.end():].strip()
    else:
        # Try trailing pattern: "chicken breast 200g"
        trailing = re.search(r"\s+(\d+(?:\.\d+)?)\s*(g|kg|ml|oz)$", description.strip(), re.IGNORECASE)
        if trailing:
            amount = float(trailing.group(1))
            unit = trailing.group(2).lower()
            food_query = description[:trailing.start()].strip()
        else:
            # Default: treat whole thing as food name, quantity = 1 serving
            amount = 1.0
            unit = "serving"
            food_query = description.strip()

    # Search for the food
    foods = await Food.find(
        {"$text": {"$search": food_query}},
        limit=3,
    ).to_list()

    if not foods:
        return f"Could not find '{food_query}' in the food database. Try searching with search_food_database first, or log manually with log_food."

    food = foods[0]  # Best match

    # Calculate multiplier based on unit
    if unit == "g":
        multiplier = amount / food.serving.grams
    elif unit == "kg":
        multiplier = (amount * 1000) / food.serving.grams
    elif unit == "oz":
        multiplier = (amount * 28.35) / food.serving.grams
    elif unit in ("serving", ""):
        multiplier = amount
    else:
        # Default to serving count for unknown units
        multiplier = amount

    # Calculate nutrition
    entry = FoodLog(
        user_id=user_id,
        date=date.today(),
        food_id=str(food.id),
        food_name=food.name,
        meal=meal,
        serving_label=f"{amount}{unit}" if unit != "serving" else f"{amount:.0f} serving",
        quantity=multiplier,
        calories=food.calories * multiplier,
        protein_g=food.protein_g * multiplier,
        carbs_g=food.carbs_g * multiplier,
        fat_g=food.fat_g * multiplier,
        fiber_g=food.fiber_g * multiplier,
        sugar_g=food.sugar_g * multiplier,
        sodium_mg=food.sodium_mg * multiplier,
        saturated_fat_g=food.saturated_fat_g * multiplier,
    )
    await entry.insert()

    return (
        f"Logged: {food.name} ({amount}{unit}) for {meal} — "
        f"{entry.calories:.0f} kcal, {entry.protein_g:.0f}g P, "
        f"{entry.carbs_g:.0f}g C, {entry.fat_g:.0f}g F"
    )


@tool
async def get_nutrient_alerts(user_id: str) -> str:
    """Check today's intake against nutrient limits (sodium, sugar, saturated fat, fiber, protein). Returns any active warnings or info alerts."""
    user = await User.get(user_id)
    protein_target = user.targets.protein_g if user.targets else 0
    alerts = await check_nutrient_alerts(
        user_id=user_id,
        protein_target=protein_target,
    )
    if not alerts:
        return "No nutrient alerts — all within healthy limits."
    return "\n".join(f"- [{a['severity'].upper()}] {a['message']}" for a in alerts)


@tool
async def get_weekly_report(user_id: str) -> str:
    """Get a summary of the user's nutrition for the past 7 days: averages, target adherence, highlights, and weight change."""
    today = date.today()
    week_ago = today - timedelta(days=6)

    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date >= week_ago,
        FoodLog.date <= today,
    ).to_list()

    if not entries:
        return "No food logged in the past 7 days."

    daily: dict[date, list] = {}
    for e in entries:
        daily.setdefault(e.date, []).append(e)

    n = len(daily)
    keys = ["calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg", "saturated_fat_g"]
    avgs = {}
    for k in keys:
        avgs[k] = sum(sum(getattr(e, k) for e in day) for day in daily.values()) / n

    # Get user targets
    user = await User.get(user_id)
    target_lines = []
    if user and user.targets:
        t = user.targets
        target_lines.append(
            f"vs Targets: {avgs['calories']:.0f}/{t.calories} kcal, "
            f"{avgs['protein_g']:.0f}/{t.protein_g}g P, "
            f"{avgs['carbs_g']:.0f}/{t.carbs_g}g C, "
            f"{avgs['fat_g']:.0f}/{t.fat_g}g F"
        )

    # Weight
    weight_line = ""
    weights = await Weight.find(
        Weight.user_id == user_id,
        Weight.date >= week_ago,
        Weight.date <= today,
    ).sort("+date").to_list()
    if len(weights) >= 2:
        diff = weights[-1].weight_kg - weights[0].weight_kg
        direction = "down" if diff < 0 else "up"
        weight_line = f"\nWeight: {direction} {abs(diff):.1f} kg this week"

    lines = [
        f"Weekly report ({week_ago} to {today}) — {n} days logged:",
        f"Daily averages: {avgs['calories']:.0f} kcal, {avgs['protein_g']:.0f}g P, {avgs['carbs_g']:.0f}g C, {avgs['fat_g']:.0f}g F",
        f"  Fiber: {avgs['fiber_g']:.0f}g, Sugar: {avgs['sugar_g']:.0f}g, Sodium: {avgs['sodium_mg']:.0f}mg, Sat Fat: {avgs['saturated_fat_g']:.0f}g",
    ]
    lines.extend(target_lines)
    if weight_line:
        lines.append(weight_line)

    return "\n".join(lines)


@tool
async def suggest_meals(user_id: str, meal: str = "", max_results: int = 5) -> str:
    """Suggest foods that fit the user's remaining macro budget for the day.
    Optionally filter by meal type. Returns foods sorted by protein density.
    Call get_daily_totals first to know how much budget remains."""
    user = await User.get(user_id)
    if not user or not user.targets:
        return "Cannot suggest meals — user targets not set."

    # Calculate remaining budget
    today = date.today()
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date == today,
    ).to_list()

    eaten_cal = sum(e.calories for e in entries)
    eaten_p = sum(e.protein_g for e in entries)
    remaining_cal = max(user.targets.calories - eaten_cal, 0)
    remaining_p = max(user.targets.protein_g - eaten_p, 0)

    if remaining_cal < 50:
        return f"You've hit your calorie target ({user.targets.calories} kcal). No more meals to suggest."

    # Find foods that fit within remaining calories
    foods = await Food.find(
        Food.calories <= remaining_cal,
        Food.calories > 0,
    ).sort("-protein_g").limit(50).to_list()

    if not foods:
        return "No foods in the database fit your remaining calorie budget."

    # Score by protein density (protein per calorie) and calorie fit
    scored = []
    for f in foods:
        protein_density = f.protein_g / f.calories if f.calories > 0 else 0
        scored.append((f, protein_density))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:max_results]

    lines = [f"Remaining budget: {remaining_cal:.0f} kcal, {remaining_p:.0f}g protein needed\n"]
    for f, pd in top:
        lines.append(
            f"- {f.name} (per {f.serving.label}): "
            f"{f.calories:.0f} kcal, {f.protein_g:.0f}g P, "
            f"{f.carbs_g:.0f}g C, {f.fat_g:.0f}g F"
        )

    return "\n".join(lines)


@tool
async def update_daily_targets(
    user_id: str,
    calories: int,
    protein_g: int,
    carbs_g: int,
    fat_g: int,
) -> str:
    """Update the user's daily macro targets."""
    user = await User.get(user_id)
    user.targets.calories = calories
    user.targets.protein_g = protein_g
    user.targets.carbs_g = carbs_g
    user.targets.fat_g = fat_g
    await user.save()
    return (
        f"Targets updated: {calories} kcal, {protein_g}g protein, "
        f"{carbs_g}g carbs, {fat_g}g fat"
    )
