"""Bridge: let a Band agent reuse Fazz Code's existing /api/generate endpoint.

The Next.js endpoint streams NDJSON (one JSON object per line) through stages
(planning -> generating -> fixing -> reviewing -> done). We POST the request,
parse the stream, and return the final file set plus any captured plan/review.

Note: /api/generate requires an authenticated session. Provide a session cookie
via FAZZ_SESSION_COOKIE (copied from a logged-in browser), or run the endpoint
behind an internal auth bypass for local testing.
"""

import json
import os

import httpx
from langchain_core.tools import tool

FAZZ_API_URL = os.getenv("FAZZ_API_URL", "http://localhost:3000")
FAZZ_SESSION_COOKIE = os.getenv("FAZZ_SESSION_COOKIE", "")


async def call_generate(
    prompt: str,
    *,
    model: str = "claude-sonnet-4-20250514",
    files: dict | None = None,
    errors: list | None = None,
    skip_plan: bool = False,
    skip_review: bool = False,
    max_fix_iterations: int = 3,
    project_id: str = "band",
) -> dict:
    """Call /api/generate and parse its NDJSON stream.

    Returns: {"plan": dict|None, "review": dict|None, "files": dict, "events": list}.
    """
    payload = {
        "prompt": prompt,
        "model": model,
        "skipPlan": skip_plan,
        "skipReview": skip_review,
        "maxFixIterations": max_fix_iterations,
        "files": files or {},
        "errors": errors or [],
        "projectId": project_id,
    }

    headers = {"Content-Type": "application/json"}
    if FAZZ_SESSION_COOKIE:
        headers["Cookie"] = FAZZ_SESSION_COOKIE

    result: dict = {"plan": None, "review": None, "files": {}, "events": []}

    async with httpx.AsyncClient(timeout=300) as client:
        async with client.stream(
            "POST", f"{FAZZ_API_URL}/api/generate", json=payload, headers=headers
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                result["events"].append(event)

                stage = event.get("stage")
                if stage == "planning" and event.get("plan"):
                    result["plan"] = event["plan"]
                elif stage == "reviewing" and event.get("review"):
                    result["review"] = event["review"]
                elif stage == "done":
                    result["files"] = event.get("files", {})

    return result


@tool
async def generate_app(prompt: str) -> str:
    """Generate or fix a web app using Fazz Code's existing build pipeline.

    Use this whenever you need to actually produce or repair the project's
    files for the user's request. Returns a JSON string containing the final
    `files`, the `plan`, and the `review`.
    """
    result = await call_generate(prompt)
    return json.dumps(
        {
            "files": result["files"],
            "plan": result["plan"],
            "review": result["review"],
        }
    )
