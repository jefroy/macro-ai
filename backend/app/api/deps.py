from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.models.user import User
from app.services.auth_service import get_user_from_token

security = HTTPBearer(auto_error=not settings.single_user_mode)

# Module-level cache for the single user (avoids DB lookup on every request)
_single_user: User | None = None


async def _get_single_user() -> User:
    """Fetch the single default user, cached after first lookup."""
    global _single_user
    if _single_user is None:
        _single_user = await User.find_one(User.email == "solo@macroai.local")
    if _single_user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Single-user mode enabled but default user not found",
        )
    return _single_user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> User:
    if settings.single_user_mode:
        return await _get_single_user()

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    user = await get_user_from_token(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account disabled",
        )
    return user
