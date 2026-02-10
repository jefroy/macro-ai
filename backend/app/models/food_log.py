from datetime import date as DateType, datetime

from beanie import Document
from pydantic import Field


class FoodLog(Document):
    user_id: str
    date: DateType = Field(default_factory=DateType.today)
    meal: str = "snack"  # breakfast, lunch, dinner, snack

    food_id: str | None = None  # reference to Food document (optional)
    food_name: str
    serving_label: str = "1 serving"
    quantity: float = 1.0

    # Computed nutritional values (quantity * per-serving)
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0
    saturated_fat_g: float = 0

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "food_logs"
