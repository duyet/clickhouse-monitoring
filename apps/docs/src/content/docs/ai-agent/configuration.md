---
title: "Configure the AI Agent"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/ai-agent/configuration.mdx"
---

## Core LLM settings

These three variables cover most deployments.

| Variable | Default | Purpose |
|---|---|---|
| `LLM_API_KEY` | — | Provider API key. Required to enable the agent. |
| `LLM_API_BASE` | `https://openrouter.ai/api/v1` | OpenAI-compatible base URL. |
| `LLM_MODEL` | `openrouter:openrouter/free` | Model identifier (`provider:modelId`). |

```bash
LLM_API_KEY=sk-or-...
LLM_API_BASE=https://openrouter.ai/api/v1
LLM_MODEL=openrouter:openrouter/auto
```

## Provider-specific keys

Set the key for each provider you want to use. Only providers with a key configured appear as selectable in the model picker.

| Variable | Provider | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | OpenRouter | Alias for `LLM_API_KEY` when using OpenRouter. |
| `OPENROUTER_API_BASE` | OpenRouter | Override base URL. |
| `OPENROUTER_REFERER` | OpenRouter | HTTP referer sent with requests (for leaderboard attribution). |
| `OPENROUTER_APP_NAME` | OpenRouter | App name sent with requests. |
| `OPENROUTER_MODELS_API` | OpenRouter | Override models list URL. |
| `NVIDIA_API_KEY` | NVIDIA NIM | NIM API key. |
| `NVIDIA_API_BASE` | NVIDIA NIM | NIM base URL (defaults to NVIDIA's hosted endpoint). |
| `ANYROUTER_API_KEY` | AnyRouter | AnyRouter API key. |
| `ANYROUTER_API_BASE` | AnyRouter | AnyRouter base URL. |

## Extra models

`LLM_EXTRA_MODELS` adds entries to the model picker without touching code. Format:

```
provider:modelId[|contextLength][|description]
```

- `provider` — one of `openrouter`, `nvidia`, `anyrouter`
- `modelId` — model ID passed to the provider (may contain colons)
- `contextLength` — optional integer token count; defaults to `128000`
- `description` — optional display label; defaults to `modelId`

Comma-separated for multiple models:

```bash
LLM_EXTRA_MODELS="nvidia:meta/llama-3.3-70b|131072|Llama 3.3 70B,openrouter:x-ai/grok-2"
```

Extra models are appended after the built-in registry. If an extra entry shares a `provider:modelId` key with a built-in, the built-in wins.

## Access & safety

| Variable | Default | Purpose |
|---|---|---|
| `CHM_FEATURE_AGENT_ACCESS` | `public` | Set to `authenticated` to require login before using the agent. |
| `AGENT_API_TOKEN` | — | Shared Bearer token accepted by `POST /api/v1/agent`. |
| `AGENT_ENABLE_CONTROL_TOOLS` | `false` | When `true`, enables `optimize_table`, `kill_query`, and `kill_mutation`. Keep off unless the ClickHouse user is trusted. |

Require auth on public deployments:

```bash
CHM_FEATURE_AGENT_ACCESS=authenticated
```

Protect the API endpoint with a bearer token:

```bash
AGENT_API_TOKEN=your-secret-token
```

```bash
curl -H "Authorization: Bearer $AGENT_API_TOKEN" \
     -d '{"message":"...","hostId":0}' \
     https://your-host/api/v1/agent
```

## Conversation persistence

| Variable | Default | Purpose |
|---|---|---|
| `AGENT_CONVERSATION_PERSISTENCE` | `false` | Enable server-side conversation storage. |
| `AGENT_CONVERSATION_STORE` | `auto` | Store backend. |

See [Conversation History](/ai-agent/conversation-history) and [Store Backends](/ai-agent/conversation-history/backends) for per-backend env vars and setup.

## Where to set these

- **Cloudflare Workers** — `wrangler secret put LLM_API_KEY` for secrets; `[vars]` in `wrangler.toml` for non-secret values. See [Deploy to Cloudflare](/deploy/cloudflare).
- **Docker** — `environment:` block in `docker-compose.yml` or `--env-file .env`. See [Deploy with Docker](/deploy/docker).
- **Kubernetes** — `Secret` for keys, `ConfigMap` for non-secret values. See [Deploy to Kubernetes](/deploy/k8s).
- **Vercel / self-hosted** — environment variables in the project dashboard or `.env.local`.
