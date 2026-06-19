"""Fixer agent — implements and fixes code from the Planner's plan.

Uses the `generate_app` tool which bridges to Fazz Code's /api/generate pipeline.
"""

import asyncio
import logging

from band_agent import make_agent
from bridge import generate_app
from prompts import FIXER_SYSTEM

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fixer")


def build():
    return make_agent(
        config_key="fixer",
        model="mimo-v2.5-pro",
        system_prompt=FIXER_SYSTEM,
        tools=[generate_app],
    )


async def main():
    agent = build()
    logger.info("Fixer running. Press Ctrl+C to stop.")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
