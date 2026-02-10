from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/templates", tags=["templates"])


class GoalTemplate(BaseModel):
    id: str
    name: str
    description: str
    goal_type: str  # cut, lean_bulk, maintain, health
    calories_adjustment: float  # multiplier vs TDEE (e.g. 0.8 for cut)
    protein_per_kg: float
    fat_pct: float  # % of calories from fat
    suggested_foods: list[str]
    tips: list[str]


# Pre-built templates
TEMPLATES: list[GoalTemplate] = [
    GoalTemplate(
        id="fat_loss",
        name="Fat Loss",
        description="Moderate calorie deficit with high protein to preserve muscle. Target 0.5-1% body weight loss per week.",
        goal_type="cut",
        calories_adjustment=0.80,
        protein_per_kg=2.2,
        fat_pct=0.25,
        suggested_foods=[
            "Chicken breast", "Greek yogurt", "Egg whites", "Salmon",
            "Broccoli", "Sweet potato", "Brown rice", "Spinach",
            "Cottage cheese", "Turkey breast",
        ],
        tips=[
            "Prioritize protein at every meal",
            "Eat high-volume, low-calorie vegetables to stay full",
            "Keep fiber above 25g/day for satiety",
            "Limit sodium to reduce water retention",
        ],
    ),
    GoalTemplate(
        id="lean_bulk",
        name="Lean Bulk",
        description="Small calorie surplus to build muscle while minimizing fat gain. Target 0.25-0.5% body weight gain per month.",
        goal_type="lean_bulk",
        calories_adjustment=1.10,
        protein_per_kg=2.0,
        fat_pct=0.25,
        suggested_foods=[
            "Chicken breast", "Rice", "Oats", "Eggs",
            "Salmon", "Pasta", "Banana", "Peanut butter",
            "Beef (lean)", "Milk",
        ],
        tips=[
            "Focus on progressive overload in training",
            "Spread protein intake across 4-5 meals",
            "Eat carbs around workouts for performance",
            "Track weight weekly — adjust if gaining too fast",
        ],
    ),
    GoalTemplate(
        id="maintenance",
        name="Maintenance",
        description="Eat at maintenance calories to maintain weight while optimizing body composition over time.",
        goal_type="maintain",
        calories_adjustment=1.0,
        protein_per_kg=1.8,
        fat_pct=0.28,
        suggested_foods=[
            "Chicken breast", "Rice", "Eggs", "Greek yogurt",
            "Salmon", "Oats", "Mixed vegetables", "Fruit",
            "Nuts", "Olive oil",
        ],
        tips=[
            "Focus on food quality and nutrient density",
            "Maintain consistent meal timing",
            "Keep protein moderate-high for body composition",
            "Aim for 5+ servings of fruits and vegetables daily",
        ],
    ),
    GoalTemplate(
        id="health_optimization",
        name="Health Optimization",
        description="Balanced diet focused on micronutrient density, fiber, and anti-inflammatory foods.",
        goal_type="maintain",
        calories_adjustment=1.0,
        protein_per_kg=1.6,
        fat_pct=0.30,
        suggested_foods=[
            "Salmon", "Blueberries", "Spinach", "Quinoa",
            "Almonds", "Avocado", "Sweet potato", "Broccoli",
            "Greek yogurt", "Olive oil",
        ],
        tips=[
            "Prioritize omega-3 fatty acids (salmon, walnuts, flaxseed)",
            "Eat a rainbow of vegetables for diverse micronutrients",
            "Keep sugar under 25g/day for metabolic health",
            "Target 30g+ fiber daily from whole food sources",
        ],
    ),
]


class ApplyTemplateResponse(BaseModel):
    template_id: str
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    message: str


@router.get("/", response_model=list[GoalTemplate])
async def list_templates():
    return TEMPLATES


@router.get("/{template_id}", response_model=GoalTemplate)
async def get_template(template_id: str):
    for t in TEMPLATES:
        if t.id == template_id:
            return t
    raise HTTPException(status_code=404, detail="Template not found")


@router.post("/{template_id}/apply", response_model=ApplyTemplateResponse)
async def apply_template(
    template_id: str,
    user: User = Depends(get_current_user),
):
    template = None
    for t in TEMPLATES:
        if t.id == template_id:
            template = t
            break

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Calculate TDEE from profile (Mifflin-St Jeor)
    p = user.profile
    if not p.weight_kg or not p.height_cm or not p.age or not p.gender:
        raise HTTPException(
            status_code=400,
            detail="Complete your profile (weight, height, age, gender) before applying a template",
        )

    if p.gender == "male":
        bmr = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5
    else:
        bmr = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161

    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9,
    }
    multiplier = activity_multipliers.get(p.activity_level, 1.55)
    tdee = bmr * multiplier

    # Apply template adjustments
    calories = round(tdee * template.calories_adjustment)
    protein_g = round(template.protein_per_kg * p.weight_kg)
    fat_g = round((calories * template.fat_pct) / 9)
    # Remaining calories from carbs
    carbs_g = round((calories - protein_g * 4 - fat_g * 9) / 4)
    carbs_g = max(carbs_g, 50)  # minimum carbs

    # Update user targets
    user.targets.calories = calories
    user.targets.protein_g = protein_g
    user.targets.carbs_g = carbs_g
    user.targets.fat_g = fat_g
    await user.save()

    return ApplyTemplateResponse(
        template_id=template_id,
        calories=calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        message=f"Applied '{template.name}' template: {calories} kcal, {protein_g}g P, {carbs_g}g C, {fat_g}g F",
    )
