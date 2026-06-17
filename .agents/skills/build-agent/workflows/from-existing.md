# Workflow: build from an existing project (Detect mode)

Use when the repo already has code. Goal: understand the current stack before
adding anything, so new agent code matches existing conventions.

## 1. Detect the techstack
Inspect manifests and config — don't guess:

- **JS/TS**: `package.json` (deps + scripts), lockfile (package manager),
  `tsconfig.json`, `next.config.*`, `wrangler.jsonc` (Cloudflare),
  `vite.config.*`, framework UI libs.
- **Python**: `pyproject.toml` / `requirements.txt` / `uv.lock`, virtualenv.
- **Go**: `go.mod`.
- **Infra**: `Dockerfile`, `docker-compose.yml`, `k8s/` manifests, Terraform,
  `.github/workflows`, `vercel.json`, `wrangler.jsonc`.
- **Existing agent code**: grep for `langgraph`, `@langchain`, `deepagents`,
  `ai` (Vercel AI SDK), `@cloudflare/agents`, `@tanstack`, `google-adk` /
  `google.adk`, `@anthropic-ai/claude-agent-sdk` / `claude_agent_sdk`,
  `openai`, `anthropic`, MCP servers.
- **Existing conventions**: read CLAUDE.md / AGENTS.md / .cursorrules, lint
  config, test setup, import style.

## 2. Confirm with the user
Summarize what you found: "This is a Next.js + TypeScript app already using the
Vercel AI SDK, deployed to Vercel." Ask only what the code can't tell you:
- What new agent capability to add and why.
- Whether to stay on the detected framework or introduce another.
- Any new tools, models, or deploy changes.

## 3. Add, don't disrupt
- Reuse the detected framework and patterns unless there's a strong reason not
  to — and if there is, surface it; don't fork silently.
- Verify the **installed version's** API against live docs (the pinned version
  is the source of truth, not memory).
- Wire new agent code into the existing API/UI/build/deploy rather than bolting
  on a parallel stack.
- Keep secrets in the existing env/secret mechanism.

## 4. Verify
Run the existing build/test/lint after changes. Make the new agent path
actually execute (not just compile) before calling it done.
