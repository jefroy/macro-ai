from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.checklist import router as checklist_router
from app.api.v1.food_log import router as food_log_router
from app.api.v1.foods import router as foods_router
from app.api.v1.recipes import router as recipes_router
from app.api.v1.reminders import router as reminders_router
from app.api.v1.reports import router as reports_router
from app.api.v1.templates import router as templates_router
from app.api.v1.users import router as users_router
from app.api.v1.weight import router as weight_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(auth_router)
v1_router.include_router(users_router)
v1_router.include_router(foods_router)
v1_router.include_router(food_log_router)
v1_router.include_router(chat_router)
v1_router.include_router(weight_router)
v1_router.include_router(reports_router)
v1_router.include_router(reminders_router)
v1_router.include_router(checklist_router)
v1_router.include_router(templates_router)
v1_router.include_router(recipes_router)
