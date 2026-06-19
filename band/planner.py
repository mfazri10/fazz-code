"""Planner agent — plans the build and coordinates Fixer + Reviewer."""

import asyncio
import logging

from band_agent import make_agent
from prompts import PLANNER_SYSTEM

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("planner")


def build():
    return make_agent(
        config_key="planner",
        model="mimo-v2.5-pro",
        system_prompt=PLANNER_SYSTEM,
    )


async def main():
    agent = build()
    logger.info("Planner running. Press Ctrl+C to stop.")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
