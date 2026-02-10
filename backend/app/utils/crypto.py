import base64
import os

from cryptography.fernet import Fernet

from app.config import settings

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        # Derive a Fernet key from the app secret_key (must be 32 url-safe base64 bytes)
        key_bytes = settings.secret_key.encode()[:32].ljust(32, b"\0")
        fernet_key = base64.urlsafe_b64encode(key_bytes)
        _fernet = Fernet(fernet_key)
    return _fernet


def encrypt_api_key(plain_key: str) -> str:
    """Encrypt an API key for storage."""
    if not plain_key:
        return ""
    return _get_fernet().encrypt(plain_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt a stored API key."""
    if not encrypted_key:
        return ""
    return _get_fernet().decrypt(encrypted_key.encode()).decode()
