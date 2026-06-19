# Fazz Code × Band AI integration

This folder contains a small **Python service** that connects Fazz Code's three
agents — **Planner**, **Fixer**, and **Reviewer** — to [Band AI](https://app.band.ai)
as *remote agents*. Once connected, they collaborate **through Band chat rooms**
using `@mention` delegation instead of hardcoded sequential calls.

> Why a separate Python service? The official Band SDK (`band-sdk`, import
> `thenvoi`) is Python-only. The Next.js app stays as-is; this service runs
> alongside it and the Fixer calls back into `/api/generate` via a bridge tool.

## Architecture

```
        Band chat room ("Build <app>")
  +------------------------------------------+
  |  Planner  --@Fixer-->  Fixer             |
  |     ^                    |               |
  |     |                    @Reviewer       |
  |     +---@Planner--- Reviewer <-----+     |
  +------------------------------------------+
                    |
         Fixer.generate_app tool
                    v
     Next.js  POST /api/generate  (NDJSON stream)
```

Each agent is a remote agent running here; it sends commands to Band over REST
and receives messages over WebSocket (handled automatically by the SDK).

### Who mentions who

| From | To | When |
| --- | --- | --- |
| Planner | `@Fixer` | Sends the build plan to implement |
| Fixer | `@Reviewer` | Sends generated/updated files for review |
| Reviewer | `@Planner` | Returns verdict (`approve` / `request_changes`) |
| Planner | `@Fixer` | Relays requested changes |
| Planner | room | Posts final summary when approved, then stops |

> **Mention-based visibility:** on Band, an agent only sees messages that
> `@mention` it. Every delegation **must** mention the target agent.

## Per-agent model (bring-your-own-model)

| Agent | Provider | Model | Tools |
| --- | --- | --- | --- |
| Planner | Anthropic | `claude-sonnet-4-20250514` | — |
| Fixer | OpenAI | `gpt-4o` | `generate_app` (bridge to `/api/generate`) |
| Reviewer | OpenAI | `gpt-4o` | — |

Edit these in `planner.py`, `fixer.py`, `reviewer.py`.

## Setup

Prerequisites: **Python 3.11+** and [`uv`](https://docs.astral.sh/uv/).

1. **Register 3 remote agents** in Band (`Agents → New Agent → External Agent`):
   `Planner`, `Fixer`, `Reviewer`. Copy each **API Key** (shown once!) and
   **Agent UUID**.

2. **Install deps** (run from this `band/` folder):
   ```bash
   uv sync
   ```

3. **Configure secrets**:
   ```bash
   cp .env.example .env                             # fill LLM keys + bridge
   cp agent_config.example.yaml agent_config.yaml   # fill agent_id + api_key
   ```
   Both files are git-ignored.

4. **Run** all three agents:
   ```bash
   uv run python run_all.py
   ```
   Or run individually: `uv run python planner.py` (and `fixer.py`, `reviewer.py`).

5. **Test in Band**: open `Chats → +`, add the three agents, then mention the
   Planner, e.g. `@Planner build a todo app landing page`.

## Files

| File | Purpose |
| --- | --- |
| `band_agent.py` | Shared helper that builds + connects a Band agent |
| `prompts.py` | System prompts (collaboration protocol) for each agent |
| `bridge.py` | `generate_app` tool — streams `/api/generate` and returns files |
| `planner.py` / `fixer.py` / `reviewer.py` | The three worker agents |
| `run_all.py` | Runs all three agents concurrently |
| `.env.example` | Band platform URLs, LLM keys, bridge config |
| `agent_config.example.yaml` | Per-agent UUID + Band API key |

## Bridge to the web app

The Fixer's `generate_app` tool (in `bridge.py`) POSTs to the existing Next.js
`/api/generate` endpoint and parses its NDJSON stream, returning the final
`files`, `plan`, and `review`. This reuses all the existing generation logic.

`/api/generate` requires an authenticated session, so set `FAZZ_SESSION_COOKIE`
in `.env` to a session cookie from a logged-in browser (or point `FAZZ_API_URL`
at an instance with an internal auth bypass for local testing).

## References

- Setup: <https://docs.band.ai/integrations/sdks/tutorials/setup>
- Connect any agent: <https://docs.band.ai/getting-started/connect-remote-agent>
- Agent API: <https://docs.band.ai/api/introduction>
- Codeband reference: <https://github.com/thenvoi/codeband>
