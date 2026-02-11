from langchain_community.chat_models import ChatLiteLLM

from app.models.user import User
from app.utils.crypto import decrypt_api_key

PROVIDER_PREFIXES = {
    "claude": "anthropic/",
    "openai": "",
    "local": "openai/",
    "custom": "openai/",
    # ZhipuAI — LiteLLM has native zai/ provider (handles base_url + auth)
    "zhipu": "zai/",
    "zai": "zai/",
    "glm": "zai/",
}

# Default base URLs for providers that need them
# (zai/ prefix handles ZhipuAI base URL automatically)
PROVIDER_BASE_URLS: dict[str, str] = {}


def build_chat_model(user: User) -> ChatLiteLLM:
    """Create a ChatLiteLLM instance from the user's AI config."""
    config = user.ai_config
    if not config or not config.provider:
        raise ValueError("No AI provider configured — go to Settings to add your API key.")

    prefix = PROVIDER_PREFIXES.get(config.provider, "")
    model = f"{prefix}{config.model}"
    api_key = decrypt_api_key(config.api_key) if config.api_key else None
    api_base = config.base_url or PROVIDER_BASE_URLS.get(config.provider) or None

    return ChatLiteLLM(
        model=model,
        api_key=api_key,
        api_base=api_base,
        max_tokens=4096,
        temperature=0.7,
        streaming=True,
    )
