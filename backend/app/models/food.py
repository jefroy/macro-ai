from datetime import datetime

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel, TEXT


class Serving(BaseModel):
    label: str = "100g"
    grams: float = 100


class Food(Document):
    name: str
    brand: str = ""
    source: str = "custom"  # "usda", "custom"
    created_by: str | None = None  # user_id for custom foods

    # Per serving
    serving: Serving = Field(default_factory=Serving)
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
        name = "foods"
        indexes = [
            IndexModel([("name", TEXT)]),
        ]
