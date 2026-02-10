from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient

_checkpointer: MongoDBSaver | None = None
_sync_client: MongoClient | None = None


def init_checkpointer(mongodb_url: str, db_name: str = "macroai") -> MongoDBSaver:
    """Initialize the MongoDB checkpointer. Call once at app startup."""
    global _checkpointer, _sync_client
    _sync_client = MongoClient(mongodb_url)
    _checkpointer = MongoDBSaver(
        client=_sync_client,
        db_name=db_name,
    )
    return _checkpointer


def get_checkpointer() -> MongoDBSaver:
    if _checkpointer is None:
        raise RuntimeError("Checkpointer not initialized — call init_checkpointer()")
    return _checkpointer


def close_checkpointer():
    global _checkpointer, _sync_client
    if _sync_client:
        _sync_client.close()
        _sync_client = None
    _checkpointer = None
