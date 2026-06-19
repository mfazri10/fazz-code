"""Run Planner, Fixer, and Reviewer agents concurrently.

Usage (from the band/ folder):
    uv run python run_all.py
"""

import asyncio
import logging

from fixer import build as build_fixer
from planner import build as build_planner
from reviewer import build as build_reviewer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("run_all")


async def main():
    agents = {
        "planner": build_planner(),
        "fixer": build_fixer(),
        "reviewer": build_reviewer(),
    }
    logger.info("Starting %d Band agents: %s", len(agents), ", ".join(agents))

    try:
        await asyncio.gather(*(agent.run() for agent in agents.values()))
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("Shutting down agents...")
        for agent in agents.values():
            await agent.stop()


if __name__ == "__main__":
    asyncio.run(main())
