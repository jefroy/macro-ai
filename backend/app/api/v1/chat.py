import json
import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from langchain_core.messages import AIMessageChunk, HumanMessage
from pydantic import BaseModel

from app.api.deps import get_current_user, _get_single_user
from app.config import settings
from app.models.chat_session import ChatSession
from app.models.user import User
from app.services.ai.checkpointer import get_checkpointer
from app.services.ai.graph import build_agent_graph
from app.services.auth_service import get_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


# ── Schemas ──────────────────────────────────────────────


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class CreateSessionRequest(BaseModel):
    title: str = "New Chat"


class ChatMessageOut(BaseModel):
    role: str  # "user" or "assistant"
    content: str


# ── REST: Session Management ─────────────────────────────


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(user: User = Depends(get_current_user)):
    sessions = await ChatSession.find(
        ChatSession.user_id == str(user.id),
    ).sort("-updated_at").to_list()

    return [
        ChatSessionResponse(
            id=str(s.id),
            title=s.title,
            created_at=s.created_at.isoformat(),
            updated_at=s.updated_at.isoformat(),
        )
        for s in sessions
    ]


@router.post("/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_session(
    data: CreateSessionRequest,
    user: User = Depends(get_current_user),
):
    session = ChatSession(
        user_id=str(user.id),
        title=data.title,
    )
    await session.insert()
    return ChatSessionResponse(
        id=str(session.id),
        title=session.title,
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
    )


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: str, user: User = Depends(get_current_user)):
    session = await ChatSession.get(session_id)
    if not session or session.user_id != str(user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    await session.delete()


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
async def get_session_messages(session_id: str, user: User = Depends(get_current_user)):
    """Get message history for a session from the LangGraph checkpoint."""
    session = await ChatSession.get(session_id)
    if not session or session.user_id != str(user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    checkpointer = get_checkpointer()
    config = {"configurable": {"thread_id": session_id}}

    try:
        state = await checkpointer.aget(config)
    except Exception:
        return []

    if not state or "channel_values" not in state:
        return []

    messages = state["channel_values"].get("messages", [])
    result = []
    for msg in messages:
        if msg.type == "human":
            result.append(ChatMessageOut(role="user", content=msg.content))
        elif msg.type == "ai" and msg.content:
            result.append(ChatMessageOut(role="assistant", content=msg.content))

    return result


# ── WebSocket: Streaming Chat ────────────────────────────


@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket):
    # Accept first, then authenticate via first message
    # (tokens in URL query strings exceed websockets library line length limits)
    await websocket.accept()

    if settings.single_user_mode:
        user = await _get_single_user()
    else:
        # Wait for auth message
        try:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            if msg.get("type") != "auth" or not msg.get("token"):
                await websocket.send_json({"type": "chat.error", "error": "First message must be auth", "code": "AUTH_REQUIRED"})
                await websocket.close(code=4001, reason="Missing auth")
                return
            user = await get_user_from_token(msg["token"])
            if not user:
                await websocket.send_json({"type": "chat.error", "error": "Invalid or expired token", "code": "UNAUTHORIZED"})
                await websocket.close(code=4001, reason="Unauthorized")
                return
        except Exception:
            await websocket.close(code=4001, reason="Auth failed")
            return

    # Check AI is configured
    if not user.ai_config or not user.ai_config.provider:
        await websocket.send_json({
            "type": "chat.error",
            "error": "AI provider not configured. Go to Settings to add your API key.",
            "code": "AI_NOT_CONFIGURED",
        })
        await websocket.close()
        return

    checkpointer = get_checkpointer()
    graph = build_agent_graph(checkpointer)

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg["type"] == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if msg["type"] == "chat.message":
                session_id = msg.get("session_id")
                content = msg.get("content", "").strip()

                if not content:
                    continue

                # Auto-create session if needed
                if not session_id:
                    session = ChatSession(user_id=str(user.id), title=content[:50])
                    await session.insert()
                    session_id = str(session.id)
                    await websocket.send_json({
                        "type": "chat.session_created",
                        "session_id": session_id,
                        "title": session.title,
                    })
                else:
                    # Update session timestamp
                    session = await ChatSession.get(session_id)
                    if session and session.user_id == str(user.id):
                        session.updated_at = datetime.now(timezone.utc)
                        await session.save()

                config = {
                    "configurable": {
                        "thread_id": session_id,
                        "user": user,
                    }
                }

                try:
                    full_response = ""
                    async for event in graph.astream(
                        {"messages": [HumanMessage(content=content)], "user_id": str(user.id)},
                        config=config,
                        stream_mode="messages",
                    ):
                        message, metadata = event
                        # Only stream AI response tokens, not tool calls/results
                        if (
                            isinstance(message, AIMessageChunk)
                            and message.content
                            and not message.tool_calls
                            and metadata.get("langgraph_node") == "agent"
                        ):
                            full_response += message.content
                            await websocket.send_json({
                                "type": "chat.token",
                                "content": message.content,
                                "session_id": session_id,
                            })

                    await websocket.send_json({
                        "type": "chat.done",
                        "session_id": session_id,
                    })

                    # Auto-title: update session title from first user message
                    if session and session.title == content[:50]:
                        # Keep the truncated first message as title
                        pass

                except Exception as e:
                    logger.error("Chat error for user %s: %s", user.id, e)
                    await websocket.send_json({
                        "type": "chat.error",
                        "error": str(e),
                        "session_id": session_id,
                    })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        try:
            await websocket.send_json({"type": "chat.error", "error": str(e)})
        except Exception:
            pass
