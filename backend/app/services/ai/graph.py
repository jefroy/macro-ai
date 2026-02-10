import json
import logging
from typing import Annotated, Sequence, TypedDict

from langchain_core.messages import BaseMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.mongodb import MongoDBSaver
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages

from app.services.ai.llm import build_chat_model
from app.services.ai.prompts import SYSTEM_PROMPT
from app.services.ai.tools import (
    get_daily_totals,
    get_nutrient_alerts,
    get_todays_food_log,
    get_user_profile,
    get_weekly_averages,
    get_weekly_report,
    get_weight_trend,
    log_food,
    quick_log,
    search_food_database,
    suggest_meals,
    update_daily_targets,
)

logger = logging.getLogger(__name__)

MAX_TOOL_CALLS_PER_TURN = 20


# ── State ────────────────────────────────────────────────


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    user_id: str


# ── Tools registry ───────────────────────────────────────

ALL_TOOLS = [
    get_user_profile,
    get_todays_food_log,
    get_daily_totals,
    get_weekly_averages,
    get_weekly_report,
    get_weight_trend,
    get_nutrient_alerts,
    search_food_database,
    log_food,
    quick_log,
    suggest_meals,
    update_daily_targets,
]

tools_by_name = {t.name: t for t in ALL_TOOLS}


# ── Nodes ────────────────────────────────────────────────


async def agent_node(state: AgentState, config: RunnableConfig):
    """Call the LLM with the current messages and bound tools."""
    user = config["configurable"]["user"]
    model = build_chat_model(user).bind_tools(ALL_TOOLS)

    system = SystemMessage(content=SYSTEM_PROMPT)
    response = await model.ainvoke([system] + list(state["messages"]), config)
    return {"messages": [response]}


async def tool_node(state: AgentState):
    """Execute tool calls from the last LLM message."""
    outputs = []
    last_message = state["messages"][-1]
    user_id = state["user_id"]

    for tool_call in last_message.tool_calls:
        name = tool_call["name"]
        args = tool_call["args"].copy()

        # Inject user_id into tools that need it (LLM never sees this param)
        if "user_id" in tools_by_name[name].args:
            args["user_id"] = user_id

        try:
            result = await tools_by_name[name].ainvoke(args)
        except Exception as e:
            logger.error("Tool %s failed: %s", name, e)
            result = f"Error calling {name}: {e}"

        outputs.append(
            ToolMessage(
                content=json.dumps(result) if not isinstance(result, str) else result,
                name=name,
                tool_call_id=tool_call["id"],
            )
        )
    return {"messages": outputs}


# ── Routing ──────────────────────────────────────────────


def should_continue(state: AgentState) -> str:
    """Route to tools if the LLM made tool calls, otherwise end."""
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        # Safety: count total tool messages to prevent infinite loops
        tool_msg_count = sum(1 for m in state["messages"] if isinstance(m, ToolMessage))
        if tool_msg_count >= MAX_TOOL_CALLS_PER_TURN:
            logger.warning("Tool call limit reached (%d), forcing end", tool_msg_count)
            return "end"
        return "tools"
    return "end"


# ── Graph Construction ───────────────────────────────────


def build_agent_graph(checkpointer: MongoDBSaver):
    """Build and compile the MacroAI ReAct agent graph."""
    workflow = StateGraph(AgentState)

    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)

    workflow.set_entry_point("agent")
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {"tools": "tools", "end": END},
    )
    workflow.add_edge("tools", "agent")

    return workflow.compile(checkpointer=checkpointer)
