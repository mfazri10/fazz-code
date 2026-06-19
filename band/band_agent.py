"""Shared helper to build and connect a Fazz Code agent to Band.

Uses Band SDK v1.0.0 with LangGraph/OpenAI adapter (Xiaomi MiMo compatible).
"""

import os

from band import Agent
from band.adapters.langgraph import LangGraphAdapter
from band.config import load_agent_config
from dotenv import load_dotenv


def make_agent(config_key: str, model: str, system_prompt: str, tools=None) -> Agent:
    """Load credentials, build the adapter, and create a Band agent."""
    load_dotenv()
    agent_id, api_key = load_agent_config(config_key)

    from langchain_openai import ChatOpenAI
    from langgraph.checkpoint.memory import InMemorySaver

    llm = ChatOpenAI(
        model=model,
        api_key=os.getenv("XIAOMI_API_KEY"),
        base_url=os.getenv("XIAOMI_BASE_URL"),
    )

    adapter = LangGraphAdapter(
        llm=llm,
        checkpointer=InMemorySaver(),
        custom_section=system_prompt,
        additional_tools=tools or [],
    )

    return Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
        ws_url=os.getenv("THENVOI_WS_URL"),
        rest_url=os.getenv("THENVOI_REST_URL"),
    )
