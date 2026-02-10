"""Seed the food database with common foods.

Usage:
    python -m seeds.seed_foods
"""

import asyncio
import json
from pathlib import Path

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models.food import Food, Serving


async def seed():
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(database=client[settings.mongodb_database], document_models=[Food])

    foods_file = Path(__file__).parent / "foods.json"
    raw_foods = json.loads(foods_file.read_text())

    existing = await Food.find(Food.source == "usda").count()
    if existing > 0:
        print(f"Found {existing} existing USDA foods. Skipping seed.")
        print("To re-seed, drop the foods collection first:")
        print(f'  mongosh --eval \'db.foods.deleteMany({{source: "usda"}})\' {settings.mongodb_url}/{settings.mongodb_database}')
        client.close()
        return

    foods = []
    for item in raw_foods:
        serving_data = item.get("serving", {"label": "100g", "grams": 100})
        food = Food(
            name=item["name"],
            source=item.get("source", "usda"),
            serving=Serving(label=serving_data["label"], grams=serving_data["grams"]),
            calories=item.get("calories", 0),
            protein_g=item.get("protein_g", 0),
            carbs_g=item.get("carbs_g", 0),
            fat_g=item.get("fat_g", 0),
            fiber_g=item.get("fiber_g", 0),
            sugar_g=item.get("sugar_g", 0),
            sodium_mg=item.get("sodium_mg", 0),
            saturated_fat_g=item.get("saturated_fat_g", 0),
        )
        foods.append(food)

    await Food.insert_many(foods)
    print(f"Seeded {len(foods)} foods into '{settings.mongodb_database}' database.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
