from datetime import date as DateType, datetime

from beanie import Document
from pydantic import Field


class ChecklistItem(Document):
    user_id: str
    date: DateType = Field(default_factory=DateType.today)
    title: str
    type: str = "auto"  # "auto" or "custom"
    checked: bool = False

    # For auto-check items: which field to compare and what target to hit
    auto_check_field: str = ""  # e.g. "protein_g", "calories", "fiber_g"
    auto_check_target: float = 0  # e.g. 170 (grams of protein)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "checklist_items"
