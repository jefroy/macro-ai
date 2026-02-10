from datetime import datetime

from beanie import Document
from pydantic import Field


class Reminder(Document):
    user_id: str
    type: str = "custom"  # meal, supplement, hydration, custom
    title: str
    description: str = ""
    time: str = "08:00"  # 24hr format "HH:MM"
    days: list[str] = Field(
        default_factory=lambda: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    )
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reminders"
