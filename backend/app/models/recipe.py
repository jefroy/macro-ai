from datetime import datetime

from beanie import Document
from pydantic import BaseModel, Field


class RecipeIngredient(BaseModel):
    food_id: str
    food_name: str
    quantity: float = 1.0
    serving_label: str = "1 serving"
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0
    saturated_fat_g: float = 0


class NutrientTotals(BaseModel):
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0
    saturated_fat_g: float = 0


class Recipe(Document):
    user_id: str
    name: str
    description: str = ""
    servings: int = 1
    ingredients: list[RecipeIngredient] = Field(default_factory=list)
    total: NutrientTotals = Field(default_factory=NutrientTotals)
    per_serving: NutrientTotals = Field(default_factory=NutrientTotals)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "recipes"
