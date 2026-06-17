---
name: build-agent
description: >-
  Build an AI-agent application end-to-end — from an empty repo or an existing
  codebase. Use when the user wants to "build an agent", "scaffold an agent
  app", "add an agent API", "build an agent UI/chat", "pick an agent framework",
  or set up tool calling, tracing, or an AI gateway. Interviews the user when
  requirements are unclear; detects the stack when a project already exists.
  Knows LangGraph, DeepAgents, Vercel AI SDK, Cloudflare Agents SDK, TanStack AI,
  Google ADK, and the Claude Agent SDK. Always verifies against live official
  docs (Context7 / llms.txt / WebFetch) before writing code.
---

# build-agent

Scaffold and grow AI-agent applications. This skill is **stack-agnostic**: it
helps you choose a framework, then builds the agent loop, tools, API surface,
UI, observability, and deployment to match the user's real requirements.

## Operating principle: verify before you build

Agent frameworks move fast. **Never rely on memory for framework APIs.** Before
writing framework code, pull live docs in this order:

1. **Context7 MCP** (if available) — `resolve-library-id` → `query-docs`.
2. **Official `llms.txt` / `llms-full.txt` / `.md`** via WebFetch — see
   `references/frameworks/*` for the canonical URLs.
3. **The installed package itself** — read `node_modules/<pkg>` or the Python
   package source; the user's pinned version is the source of truth.

The `references/` tree here is a **thin glossary + link index**, deliberately
kept small so it does not go stale. It tells you *what exists and where the real
docs are* — not the full API. Treat any code snippet in references as
illustrative, then confirm against live docs.

If the host agent already has Context7, WebSearch, zread, or a relevant skill —
use it. Don't reinvent retrieval.

## Step 1 — Determine the entry mode

Decide which of these you're in, then jump to the matching workflow:

| Situation | Mode | Workflow |
|-----------|------|----------|
| Empty/near-empty repo, or user says "from scratch" | **Interview** | `workflows/from-scratch.md` |
| Existing project with code | **Detect** | `workflows/from-existing.md` |
| User explicitly asks to (re)interview | **Interview** | `workflows/from-scratch.md` |

Quick check: list the repo, look for `package.json` / `pyproject.toml` /
`wrangler.jsonc` / `go.mod`. Nothing meaningful → Interview. Something there →
Detect the techstack first, confirm it with the user, then only ask what the
code can't answer.

## Step 2 — Interview deeply (when in Interview mode)

Use the host's **ask-user** tool. Don't ask one shallow question — gather as much
as possible across these dimensions. Follow `workflows/from-scratch.md` for the
full question bank. Cover at minimum:

- **Purpose / use case** — what should the agent *do*? (RAG assistant, coding
  agent, workflow automation, customer support, research, multi-agent system…)
- **Language** — TypeScript / Python / Go / other.
- **Framework** — see the chooser below; recommend, don't impose.
- **Architecture** — single agent, supervisor/multi-agent, graph/state machine,
  human-in-the-loop, durable/long-running, streaming vs batch.
- **Model + provider** — Claude / GPT / Gemini / open models; direct or via a
  gateway (OpenRouter / AnyRouter / AI gateway).
- **Tools / integrations** — what external actions (search, code exec, DB, MCP
  servers, APIs) the agent needs.
- **UI/UX** — chat UI, dashboard, headless API only, CLI, embedded widget.
- **Persistence / memory** — conversation state, vector store, checkpointing.
- **Observability** — tracing, evals, cost/latency tracking (see
  `references/concepts/tracking-observability.md`).
- **Deploy target** — Docker, VM, k3s/Kubernetes, a cloud (AWS/GCP/Azure),
  Cloudflare Workers, Vercel, serverless.

Restate the assembled requirements back to the user before scaffolding.

## Step 3 — Choose the framework

Match the dominant requirement to a framework. Full notes in
`references/frameworks/`.

| If the user wants… | Lean toward | Lang |
|--------------------|-------------|------|
| Stateful graphs, supervisor/multi-agent, human-in-loop, checkpointing | **LangGraph** | Py / TS |
| Opinionated "deep" planning agent (subagents, file tools, todo) on top of LangGraph | **DeepAgents** | Py / TS |
| Web app with streaming chat, tool calls, generative UI; Next.js/React | **Vercel AI SDK** | TS |
| Edge-native, durable, stateful agents that scale to zero | **Cloudflare Agents SDK** (Durable Objects) | TS |
| Provider-agnostic, type-safe streaming/tools/structured output in any TS app | **TanStack AI** | TS |
| Google-ecosystem, Gemini-first, code-first multi-agent with eval tooling | **Google ADK** | Py / Java |
| Build on the same harness Claude Code uses; subagents, MCP, hooks, permissions | **Claude Agent SDK** | Py / TS |

Mixed needs are common (e.g. LangGraph backend + AI SDK frontend, or Claude
Agent SDK behind a Cloudflare Worker). Compose; don't force one box.

## Step 4 — Scaffold

Build the minimum that runs, then layer on. Match the chosen framework's
conventions exactly — pull its quickstart from live docs first.

Typical layers (build only what the requirements call for):

1. **Agent core** — the loop / graph / state. Confirm the current API shape.
2. **Tools** — define and wire tool calls. See `references/concepts/tool-calling.md`.
3. **Model access** — direct provider or gateway. See
   `references/concepts/ai-gateways.md` for OpenRouter / AnyRouter / AI gateway.
4. **API surface** — HTTP/streaming endpoints, or MCP server, per deploy target.
5. **UI/UX** — chat or dashboard. For React, prefer the framework's own UI
   primitives (AI SDK UI / AI Elements, Assistant UI, TanStack). For design
   quality, defer to the host's frontend-design skill if present.
6. **Persistence & memory** — checkpointer / store / vector DB.
7. **Observability** — tracing + evals + cost tracking from day one.
8. **Deploy** — Dockerfile / wrangler / k8s manifests / cloud config for the
   chosen target.

After each layer: make it run, verify, then continue. Fail loud if a step is
skipped.

## Step 5 — Agent-engineering concepts

These cut across frameworks — read the matching reference when relevant:

- **Building skills for agents** → `references/concepts/skills.md`
- **Tool calling** (schemas, validation, parallel calls, MCP) → `references/concepts/tool-calling.md`
- **Tracking / observability** (traces, evals, cost) → `references/concepts/tracking-observability.md`
- **AI gateways** (OpenRouter, AnyRouter, AI gateway, BYOK) → `references/concepts/ai-gateways.md`
- **Model-specific prompting** → `references/engineering/{claude,gemini,gpt}.md`

## Guardrails

- Don't pick a framework silently — recommend with a one-line why, let the user
  decide.
- Don't embed stale API code — verify against live docs first.
- Build the smallest thing that runs before expanding.
- Keep secrets out of the repo; use env vars / the platform's secret store.
- Match the existing codebase's conventions when in Detect mode.
