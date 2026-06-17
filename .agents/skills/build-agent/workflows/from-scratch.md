# Workflow: build from scratch (Interview mode)

Use when the repo is empty/near-empty or the user explicitly wants to start
fresh. Goal: extract as much real requirement as possible **before** writing
code, using the host's ask-user tool. Ask in small batched rounds; restate the
assembled spec at the end.

## Question bank

Group questions; don't dump all at once. Ask the high-leverage ones first
(purpose, language, deploy target), then drill in.

### 1. Purpose & use case
- What should the agent actually do? One sentence.
- Who uses it, and how (chat, API call, scheduled job, embedded)?
- Single capability or a workflow of steps?

### 2. Language & runtime
- TypeScript, Python, Go, other?
- Existing team conventions / preferred package manager?

### 3. Architecture
- Single agent, or multi-agent (supervisor / handoff / swarm)?
- Stateful graph / state machine, or simple loop?
- Human-in-the-loop approvals? Long-running / durable?
- Streaming responses or batch?

### 4. Model & provider
- Claude, GPT, Gemini, open models, or mixed?
- Direct provider SDK, or a gateway (OpenRouter / AnyRouter / AI gateway)?
- BYOK? Cost ceiling / latency needs?

### 5. Tools & integrations
- What external actions: web search, code execution, DB, file ops, internal
  APIs, MCP servers?
- Any tool that must run server-side / sandboxed?

### 6. UI / UX
- Chat UI, dashboard, CLI, headless API, embedded widget, none?
- Framework for UI (Next.js, TanStack Start, plain React, etc.)?
- Design bar — production-grade, or internal tool?

### 7. Persistence & memory
- Conversation history, checkpointing, vector store / RAG?
- Where does state live (Postgres, SQLite, Durable Objects, Redis, KV)?

### 8. Observability
- Tracing (LangSmith, Langfuse, OpenTelemetry, provider dashboards)?
- Evals? Cost/latency tracking?

### 9. Deployment
- Docker, VM, k3s/Kubernetes, cloud (AWS/GCP/Azure), Cloudflare Workers,
  Vercel, other serverless?
- Scale expectations; scale-to-zero needed?

## After the interview
1. Restate the full spec back; get confirmation.
2. Pick the framework (see SKILL.md Step 3) with a one-line rationale.
3. Pull the framework's current quickstart from live docs.
4. Scaffold the minimum that runs (SKILL.md Step 4), then layer.
