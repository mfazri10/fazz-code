# Fazz Code × Band AI integration

This folder contains a small **Python service** that connects Fazz Code's three
agents — **Planner**, **Fixer**, and **Reviewer** — to [Band AI](https://app.band.ai)
as *remote agents*. Once connected, they collaborate **through Band chat rooms**
using `@mention` delegation instead of hardcoded sequential calls.

> Why a separate Python service? The official Band SDK (`band-sdk`, import
> `thenvoi`) is Python-only. The Next.js app stays as-is; this service runs
> alongside it and (optionally) calls back into `/api/generate`.

## Architecture

```
        Band chat room ("Build <app>")
  +------------------------------------------+
  |  Planner  --@Fixer-->  Fixer             |
  |     ^                    |               |
  |     |                    @Reviewer       |
  |     +---@Planner--- Reviewer <-----+     |
  +------------------------------------------+
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

| Agent | Provider | Model |
| --- | --- | --- |
| Planner | Anthropic | `claude-sonnet-4-20250514` |
| Fixer | Anthropic | `claude-sonnet-4-20250514` |
| Reviewer | OpenAI | `gpt-4o` |

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
   cp .env.example .env                       # fill LLM keys
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
| `planner.py` / `fixer.py` / `reviewer.py` | The three worker agents |
| `run_all.py` | Runs all three agents concurrently |
| `.env.example` | Band platform URLs + LLM keys |
| `agent_config.example.yaml` | Per-agent UUID + Band API key |

## Optional: bridge back to the web app

Inside any worker you can call the existing Next.js endpoint instead of
re-implementing logic, e.g. `POST http://localhost:3000/api/generate`, and
relay the result into the Band room. See the integration page in Notion for
details.

## References

- Setup: <https://docs.band.ai/integrations/sdks/tutorials/setup>
- Connect any agent: <https://docs.band.ai/getting-started/connect-remote-agent>
- Agent API: <https://docs.band.ai/api/introduction>
- Codeband reference: <https://github.com/thenvoi/codeband>
