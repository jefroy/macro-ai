from langchain_community.chat_models import ChatLiteLLM

from app.models.user import User
from app.utils.crypto import decrypt_api_key

PROVIDER_PREFIXES = {
    "claude": "anthropic/",
    "openai": "",
    "local": "openai/",
    "custom": "openai/",
    "zhipu": "zai/",
    "zai": "zai/",
    "glm": "zai/",
}


def build_chat_model(user: User) -> ChatLiteLLM:
    """Create a ChatLiteLLM instance from the user's AI config."""
    config = user.ai_config
    if not config or not config.provider:
        raise ValueError("No AI provider configured — go to Settings to add your API key.")

    prefix = PROVIDER_PREFIXES.get(config.provider, "")
    model = f"{prefix}{config.model}"
    api_key = decrypt_api_key(config.api_key) if config.api_key else None

    return ChatLiteLLM(
        model=model,
        api_key=api_key,
        api_base=config.base_url or None,
        max_tokens=4096,
        temperature=0.7,
        streaming=True,
    )
