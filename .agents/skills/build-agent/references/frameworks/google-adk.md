# Google ADK (Agent Development Kit)

Google's code-first framework for building, evaluating, and deploying agents —
**Gemini-first** but model-agnostic. Strong multi-agent composition and built-in
evaluation; integrates with Vertex AI / Agent Engine for deployment.

**Live docs:** https://google.github.io/adk-docs/ ·
llms: https://google.github.io/adk-docs/llms.txt ·
Python `google-adk` · also Java

## Glossary
- **`Agent` / `LlmAgent`** — an LLM-driven agent with instructions + tools.
- **Workflow agents** — `Sequential`, `Parallel`, `Loop` for deterministic flow.
- **Tools** — Python/Java functions, plus built-ins (search, code exec) and MCP.
- **Sub-agents** — compose agents into hierarchies / handoffs.
- **Sessions / state / memory** — conversation + long-term memory services.
- **Evaluation** — built-in eval framework for trajectories and responses.
- **Runner** — drives an agent over a session; `adk web` dev UI.
- **Deploy** — Cloud Run, Agent Engine (Vertex AI), or container.

## When to choose
Google Cloud / Vertex AI ecosystem, Gemini models, need first-class evaluation
and multi-agent orchestration in Python (or Java).

## Before coding
Pull the current quickstart from the ADK docs (or `llms.txt`) — runner/session
APIs and deployment paths change. Confirm Gemini model ids against live docs.
