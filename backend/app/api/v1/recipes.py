from datetime import date as DateType, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.food import Food
from app.models.food_log import FoodLog
from app.models.recipe import NutrientTotals, Recipe, RecipeIngredient
from app.models.user import User

router = APIRouter(prefix="/recipes", tags=["recipes"])

NUTRIENT_KEYS = [
    "calories", "protein_g", "carbs_g", "fat_g",
    "fiber_g", "sugar_g", "sodium_mg", "saturated_fat_g",
]


class IngredientInput(BaseModel):
    food_id: str
    quantity: float = 1.0


class CreateRecipeRequest(BaseModel):
    name: str
    description: str = ""
    servings: int = 1
    ingredients: list[IngredientInput]


class UpdateRecipeRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    servings: int | None = None
    ingredients: list[IngredientInput] | None = None


class IngredientResponse(BaseModel):
    food_id: str
    food_name: str
    quantity: float
    serving_label: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    saturated_fat_g: float


class NutrientTotalsResponse(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    saturated_fat_g: float


class RecipeResponse(BaseModel):
    id: str
    name: str
    description: str
    servings: int
    ingredients: list[IngredientResponse]
    total: NutrientTotalsResponse
    per_serving: NutrientTotalsResponse


def _recipe_response(recipe: Recipe) -> RecipeResponse:
    return RecipeResponse(
        id=str(recipe.id),
        name=recipe.name,
        description=recipe.description,
        servings=recipe.servings,
        ingredients=[
            IngredientResponse(
                food_id=i.food_id,
                food_name=i.food_name,
                quantity=i.quantity,
                serving_label=i.serving_label,
                calories=i.calories,
                protein_g=i.protein_g,
                carbs_g=i.carbs_g,
                fat_g=i.fat_g,
                fiber_g=i.fiber_g,
                sugar_g=i.sugar_g,
                sodium_mg=i.sodium_mg,
                saturated_fat_g=i.saturated_fat_g,
            )
            for i in recipe.ingredients
        ],
        total=NutrientTotalsResponse(**recipe.total.model_dump()),
        per_serving=NutrientTotalsResponse(**recipe.per_serving.model_dump()),
    )


async def _build_ingredients(inputs: list[IngredientInput]) -> list[RecipeIngredient]:
    """Resolve food_ids to full ingredient data with calculated nutrients."""
    ingredients = []
    for inp in inputs:
        food = await Food.get(inp.food_id)
        if not food:
            raise HTTPException(status_code=400, detail=f"Food {inp.food_id} not found")
        qty = inp.quantity
        ingredients.append(
            RecipeIngredient(
                food_id=str(food.id),
                food_name=food.name,
                quantity=qty,
                serving_label=food.serving.label,
                calories=food.calories * qty,
                protein_g=food.protein_g * qty,
                carbs_g=food.carbs_g * qty,
                fat_g=food.fat_g * qty,
                fiber_g=food.fiber_g * qty,
                sugar_g=food.sugar_g * qty,
                sodium_mg=food.sodium_mg * qty,
                saturated_fat_g=food.saturated_fat_g * qty,
            )
        )
    return ingredients


def _calc_totals(ingredients: list[RecipeIngredient], servings: int) -> tuple[NutrientTotals, NutrientTotals]:
    total_data = {}
    for key in NUTRIENT_KEYS:
        total_data[key] = sum(getattr(i, key) for i in ingredients)
    total = NutrientTotals(**total_data)
    per_serving = NutrientTotals(**{k: round(v / max(servings, 1), 1) for k, v in total_data.items()})
    return total, per_serving


@router.get("/", response_model=list[RecipeResponse])
async def list_recipes(user: User = Depends(get_current_user)):
    recipes = await Recipe.find(Recipe.user_id == str(user.id)).sort("-created_at").to_list()
    return [_recipe_response(r) for r in recipes]


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(recipe_id: str, user: User = Depends(get_current_user)):
    recipe = await Recipe.get(recipe_id)
    if not recipe or recipe.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _recipe_response(recipe)


@router.post("/", response_model=RecipeResponse, status_code=201)
async def create_recipe(
    data: CreateRecipeRequest,
    user: User = Depends(get_current_user),
):
    ingredients = await _build_ingredients(data.ingredients)
    total, per_serving = _calc_totals(ingredients, data.servings)

    recipe = Recipe(
        user_id=str(user.id),
        name=data.name,
        description=data.description,
        servings=data.servings,
        ingredients=ingredients,
        total=total,
        per_serving=per_serving,
    )
    await recipe.insert()
    return _recipe_response(recipe)


@router.patch("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: str,
    data: UpdateRecipeRequest,
    user: User = Depends(get_current_user),
):
    recipe = await Recipe.get(recipe_id)
    if not recipe or recipe.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Recipe not found")

    if data.name is not None:
        recipe.name = data.name
    if data.description is not None:
        recipe.description = data.description
    if data.servings is not None:
        recipe.servings = data.servings

    if data.ingredients is not None:
        recipe.ingredients = await _build_ingredients(data.ingredients)

    # Recalculate nutrients if ingredients or servings changed
    if data.ingredients is not None or data.servings is not None:
        recipe.total, recipe.per_serving = _calc_totals(recipe.ingredients, recipe.servings)

    recipe.updated_at = datetime.utcnow()
    await recipe.save()
    return _recipe_response(recipe)


@router.delete("/{recipe_id}", status_code=204)
async def delete_recipe(
    recipe_id: str,
    user: User = Depends(get_current_user),
):
    recipe = await Recipe.get(recipe_id)
    if not recipe or recipe.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Recipe not found")
    await recipe.delete()


class LogRecipeRequest(BaseModel):
    meal: str = "lunch"
    servings: float = 1.0
    date: DateType | None = None


@router.post("/{recipe_id}/log", status_code=201)
async def log_recipe(
    recipe_id: str,
    data: LogRecipeRequest,
    user: User = Depends(get_current_user),
):
    """Log a recipe as a food log entry."""
    recipe = await Recipe.get(recipe_id)
    if not recipe or recipe.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Recipe not found")

    multiplier = data.servings
    ps = recipe.per_serving

    entry = FoodLog(
        user_id=str(user.id),
        date=data.date or DateType.today(),
        meal=data.meal,
        food_name=recipe.name,
        serving_label=f"{data.servings} serving{'s' if data.servings != 1 else ''}",
        quantity=data.servings,
        calories=ps.calories * multiplier,
        protein_g=ps.protein_g * multiplier,
        carbs_g=ps.carbs_g * multiplier,
        fat_g=ps.fat_g * multiplier,
        fiber_g=ps.fiber_g * multiplier,
        sugar_g=ps.sugar_g * multiplier,
        sodium_mg=ps.sodium_mg * multiplier,
        saturated_fat_g=ps.saturated_fat_g * multiplier,
    )
    await entry.insert()

    return {
        "id": str(entry.id),
        "food_name": entry.food_name,
        "calories": entry.calories,
        "protein_g": entry.protein_g,
        "carbs_g": entry.carbs_g,
        "fat_g": entry.fat_g,
    }
