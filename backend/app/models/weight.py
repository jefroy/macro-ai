from datetime import date as DateType, datetime

from beanie import Document
from pydantic import Field


class Weight(Document):
    user_id: str
    date: DateType = Field(default_factory=DateType.today)
    weight_kg: float
    note: str = ""

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "weights"
