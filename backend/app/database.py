from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models.chat_session import ChatSession
from app.models.checklist import ChecklistItem
from app.models.food import Food
from app.models.food_log import FoodLog
from app.models.recipe import Recipe
from app.models.reminder import Reminder
from app.models.user import User
from app.models.weight import Weight

_client: AsyncIOMotorClient | None = None


async def init_database():
    global _client
    _client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=_client[settings.mongodb_database],
        document_models=[User, Food, FoodLog, ChatSession, Weight, Reminder, ChecklistItem, Recipe],
    )


async def close_database():
    global _client
    if _client:
        _client.close()
        _client = None
