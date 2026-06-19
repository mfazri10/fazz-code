"""Reviewer agent — reviews generated code and returns a verdict."""

import asyncio
import logging

from band_agent import make_agent
from prompts import REVIEWER_SYSTEM

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reviewer")


def build():
    return make_agent(
        config_key="reviewer",
        model="mimo-v2.5-pro",
        system_prompt=REVIEWER_SYSTEM,
    )


async def main():
    agent = build()
    logger.info("Reviewer running. Press Ctrl+C to stop.")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
