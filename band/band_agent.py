"""Shared helper to build and connect a Fazz Code agent to Band.

The Band SDK exposes adapters per framework/provider. We support two here:
- \"anthropic\": direct Anthropic adapter
- \"openai\": LangGraph adapter backed by ChatOpenAI

See https://docs.band.ai/getting-started/connect-remote-agent
"""

import os

from dotenv import load_dotenv
from thenvoi import Agent
from thenvoi.config import load_agent_config


def build_adapter(provider: str, model: str, system_prompt: str, tools=None):
    """Create a Band adapter for the given LLM provider."""
    tools = tools or []

    if provider == "anthropic":
        from thenvoi.adapters import AnthropicAdapter

        return AnthropicAdapter(
            system_prompt=system_prompt,
            model=model,
            additional_tools=tools,
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        from langgraph.checkpoint.memory import InMemorySaver
        from thenvoi.adapters import LangGraphAdapter

        return LangGraphAdapter(
            llm=ChatOpenAI(model=model),
            checkpointer=InMemorySaver(),
            system_prompt=system_prompt,
            additional_tools=tools,
        )

    raise ValueError(f"Unknown provider: {provider!r} (expected 'anthropic' or 'openai')")


def make_agent(config_key: str, provider: str, model: str, system_prompt: str, tools=None) -> Agent:
    """Load credentials, build the adapter, and create a Band agent.

    The returned agent is created but not yet started. Call `await agent.run()`
    to connect and keep it running.
    """
    load_dotenv()
    agent_id, api_key = load_agent_config(config_key)

    adapter = build_adapter(provider, model, system_prompt, tools)

    return Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
        ws_url=os.getenv("THENVOI_WS_URL"),
        rest_url=os.getenv("THENVOI_REST_URL"),
    )
