import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import v1_router
from app.config import settings
from app.database import close_database, init_database
from app.redis import close_redis, get_redis, init_redis
from app.services.ai.checkpointer import close_checkpointer, init_checkpointer

logger = logging.getLogger(__name__)


async def ensure_single_user():
    """Create a default user for single-user mode if none exists."""
    from app.models.user import User
    from app.services.auth_service import hash_password

    existing = await User.find_one(User.email == "solo@macroai.local")
    if existing:
        logger.info("Single-user mode: default user already exists")
        return
    user = User(
        email="solo@macroai.local",
        password_hash=hash_password("single-user-mode"),
        has_completed_onboarding=False,
    )
    await user.insert()
    logger.info("Single-user mode: created default user (solo@macroai.local)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_database()
    await init_redis()
    init_checkpointer(settings.mongodb_url, settings.mongodb_database)
    if settings.single_user_mode:
        await ensure_single_user()
    yield
    close_checkpointer()
    await close_database()
    await close_redis()


app = FastAPI(
    title="MacroAI API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
async def health():
    checks = {}

    # MongoDB
    try:
        from app.database import _client

        await _client.admin.command("ping")
        checks["mongodb"] = "ok"
    except Exception:
        checks["mongodb"] = "error"

    # Redis
    try:
        redis = get_redis()
        await redis.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "error"

    all_ok = all(v == "ok" for v in checks.values())
    status_code = 200 if all_ok else 503

    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=status_code,
        content={"status": "healthy" if all_ok else "degraded", "checks": checks},
    )
