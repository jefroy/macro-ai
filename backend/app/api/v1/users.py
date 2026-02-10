from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.checklist import ChecklistItem
from app.models.food_log import FoodLog
from app.models.recipe import Recipe
from app.models.reminder import Reminder
from app.models.user import User
from app.models.weight import Weight
from app.schemas.user import AIConfigResponse, AIConfigUpdate, ProfileUpdate, TargetsUpdate, UserResponse
from app.services.tdee_service import calculate_tdee, suggest_targets
from app.utils.crypto import decrypt_api_key, encrypt_api_key

router = APIRouter(prefix="/users", tags=["users"])


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        profile=user.profile,
        targets=user.targets,
        has_completed_onboarding=user.has_completed_onboarding,
        has_ai_configured=bool(user.ai_config and user.ai_config.provider),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return _user_response(user)


@router.patch("/me/profile", response_model=UserResponse)
async def update_profile(
    data: ProfileUpdate,
    user: User = Depends(get_current_user),
):
    update_data = data.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(user.profile, key, value)
    user.updated_at = datetime.now(timezone.utc)
    await user.save()
    return _user_response(user)


@router.patch("/me/targets", response_model=UserResponse)
async def update_targets(
    data: TargetsUpdate,
    user: User = Depends(get_current_user),
):
    update_data = data.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(user.targets, key, value)
    user.updated_at = datetime.now(timezone.utc)
    await user.save()
    return _user_response(user)


class TDEERequest(BaseModel):
    weight_kg: float
    height_cm: float
    age: int
    gender: str
    activity_level: str
    goal: str = "maintain"


class TDEEResponse(BaseModel):
    tdee: int
    suggested_targets: dict


@router.post("/me/calculate-tdee", response_model=TDEEResponse)
async def calc_tdee(data: TDEERequest):
    tdee = calculate_tdee(
        weight_kg=data.weight_kg,
        height_cm=data.height_cm,
        age=data.age,
        gender=data.gender,
        activity_level=data.activity_level,
    )
    targets = suggest_targets(tdee, goal=data.goal, weight_kg=data.weight_kg)
    return TDEEResponse(tdee=tdee, suggested_targets=targets)


class OnboardingRequest(BaseModel):
    display_name: str
    age: int
    height_cm: float
    weight_kg: float
    gender: str
    activity_level: str
    goal: str = "maintain"
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int


@router.post("/me/onboarding", response_model=UserResponse)
async def complete_onboarding(
    data: OnboardingRequest,
    user: User = Depends(get_current_user),
):
    user.profile.display_name = data.display_name
    user.profile.age = data.age
    user.profile.height_cm = data.height_cm
    user.profile.weight_kg = data.weight_kg
    user.profile.gender = data.gender
    user.profile.activity_level = data.activity_level

    user.targets.calories = data.calories
    user.targets.protein_g = data.protein_g
    user.targets.carbs_g = data.carbs_g
    user.targets.fat_g = data.fat_g

    user.has_completed_onboarding = True
    user.updated_at = datetime.now(timezone.utc)
    await user.save()
    return _user_response(user)


@router.get("/me/ai-config", response_model=AIConfigResponse)
async def get_ai_config(user: User = Depends(get_current_user)):
    config = user.ai_config
    return AIConfigResponse(
        provider=config.provider,
        model=config.model,
        has_api_key=bool(config.api_key),
        base_url=config.base_url,
    )


@router.put("/me/ai-config", response_model=AIConfigResponse)
async def update_ai_config(
    data: AIConfigUpdate,
    user: User = Depends(get_current_user),
):
    user.ai_config.provider = data.provider
    user.ai_config.model = data.model
    if data.api_key:
        user.ai_config.api_key = encrypt_api_key(data.api_key)
    user.ai_config.base_url = data.base_url
    user.updated_at = datetime.now(timezone.utc)
    await user.save()
    return AIConfigResponse(
        provider=user.ai_config.provider,
        model=user.ai_config.model,
        has_api_key=bool(user.ai_config.api_key),
        base_url=user.ai_config.base_url,
    )


@router.get("/me/export")
async def export_all_data(user: User = Depends(get_current_user)):
    """Export all user data as JSON."""
    user_id = str(user.id)

    food_logs = await FoodLog.find(FoodLog.user_id == user_id).sort("+date").to_list()
    weights = await Weight.find(Weight.user_id == user_id).sort("+date").to_list()
    recipes = await Recipe.find(Recipe.user_id == user_id).to_list()
    reminders = await Reminder.find(Reminder.user_id == user_id).to_list()
    checklist = await ChecklistItem.find(ChecklistItem.user_id == user_id).to_list()

    data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "profile": {
            "email": user.email,
            "display_name": user.profile.display_name,
            "age": user.profile.age,
            "height_cm": user.profile.height_cm,
            "weight_kg": user.profile.weight_kg,
            "gender": user.profile.gender,
            "activity_level": user.profile.activity_level,
        },
        "targets": {
            "calories": user.targets.calories,
            "protein_g": user.targets.protein_g,
            "carbs_g": user.targets.carbs_g,
            "fat_g": user.targets.fat_g,
            "fiber_g": user.targets.fiber_g,
        },
        "food_logs": [
            {
                "date": e.date.isoformat(),
                "meal": e.meal,
                "food_name": e.food_name,
                "serving_label": e.serving_label,
                "quantity": e.quantity,
                "calories": e.calories,
                "protein_g": e.protein_g,
                "carbs_g": e.carbs_g,
                "fat_g": e.fat_g,
                "fiber_g": e.fiber_g,
                "sugar_g": e.sugar_g,
                "sodium_mg": e.sodium_mg,
                "saturated_fat_g": e.saturated_fat_g,
            }
            for e in food_logs
        ],
        "weight_entries": [
            {"date": w.date.isoformat(), "weight_kg": w.weight_kg, "note": getattr(w, "note", "")}
            for w in weights
        ],
        "recipes": [
            {
                "name": r.name,
                "description": r.description,
                "servings": r.servings,
                "ingredients": [
                    {
                        "food_name": i.food_name,
                        "quantity": i.quantity,
                        "calories": i.calories,
                        "protein_g": i.protein_g,
                        "carbs_g": i.carbs_g,
                        "fat_g": i.fat_g,
                    }
                    for i in r.ingredients
                ],
                "per_serving": r.per_serving.model_dump(),
            }
            for r in recipes
        ],
        "reminders": [
            {"type": r.type, "title": r.title, "time": r.time, "enabled": r.enabled}
            for r in reminders
        ],
        "checklist": [
            {"title": c.title, "type": c.type, "checked": c.checked, "date": c.date.isoformat()}
            for c in checklist
        ],
    }

    return JSONResponse(
        content=data,
        headers={"Content-Disposition": 'attachment; filename="macroai_export.json"'},
    )
