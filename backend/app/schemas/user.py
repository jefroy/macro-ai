from pydantic import BaseModel

from app.models.user import Profile, Targets


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    profile: Profile
    targets: Targets
    has_completed_onboarding: bool
    has_ai_configured: bool = False


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    gender: str | None = None
    activity_level: str | None = None
    timezone: str | None = None


class TargetsUpdate(BaseModel):
    calories: int | None = None
    protein_g: int | None = None
    carbs_g: int | None = None
    fat_g: int | None = None
    fiber_g: int | None = None


class AIConfigUpdate(BaseModel):
    provider: str
    model: str
    api_key: str = ""
    base_url: str = ""


class AIConfigResponse(BaseModel):
    provider: str
    model: str
    has_api_key: bool
    base_url: str
