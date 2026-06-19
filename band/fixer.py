"""Fixer agent — implements and fixes code from the Planner's plan."""

import asyncio
import logging

from band_agent import make_agent
from prompts import FIXER_SYSTEM

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fixer")


def build():
    return make_agent(
        config_key="fixer",
        provider="anthropic",
        model="claude-sonnet-4-20250514",
        system_prompt=FIXER_SYSTEM,
    )


async def main():
    agent = build()
    logger.info("Fixer running. Press Ctrl+C to stop.")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
