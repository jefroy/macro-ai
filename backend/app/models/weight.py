from datetime import date, datetime

from beanie import Document
from pydantic import Field


class Weight(Document):
    user_id: str
    date: date = Field(default_factory=date.today)
    weight_kg: float
    note: str = ""

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "weights"
