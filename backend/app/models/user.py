from datetime import datetime

from beanie import Document
from pydantic import BaseModel, EmailStr, Field


class Profile(BaseModel):
    display_name: str = ""
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    gender: str | None = None
    activity_level: str = "moderate"
    timezone: str = "UTC"


class Targets(BaseModel):
    calories: int = 2000
    protein_g: int = 150
    carbs_g: int = 200
    fat_g: int = 65
    fiber_g: int = 30


class AIConfig(BaseModel):
    provider: str = ""  # "claude", "openai", "local", "custom"
    model: str = ""
    api_key: str = ""  # encrypted at rest
    base_url: str = ""  # for local/custom providers


class User(Document):
    email: str = Field(..., unique=True)
    password_hash: str
    role: str = "user"
    is_active: bool = True

    profile: Profile = Field(default_factory=Profile)
    targets: Targets = Field(default_factory=Targets)
    ai_config: AIConfig = Field(default_factory=AIConfig)
    has_completed_onboarding: bool = False
    favorite_foods: list[str] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
