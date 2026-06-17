# AI gateways

A gateway sits between your app and model providers, giving you one endpoint,
many models, plus caching, fallback, rate limiting, cost tracking, and logging.
Most are **OpenAI-API-compatible**, so you swap a base URL + key and keep your
SDK.

## Options
- **OpenRouter** — `https://openrouter.ai/api/v1`. Huge model catalog across
  providers, unified billing, automatic fallback, provider routing prefs. Model
  ids look like `anthropic/claude-...`, `openai/gpt-...`, `google/gemini-...`.
  Optional app-attribution headers (`HTTP-Referer`, `X-Title`).
- **AnyRouter** (`anyrouter.dev`) — unified gateway with `provider/model` ids,
  app-attribution headers (`X-AnyRouter-*`), provider preferences, streaming,
  and BYOK. Docs: https://anyrouter.dev/docs.md. Also ships an **MCP server**
  (endpoint `https://anyrouter.dev/api/v1/mcp`, auth-gated). Host skill:
  `anyrouter` (and `anyrouter:anyrouter-migrate` to swap an existing
  Anthropic/OpenAI/OpenRouter integration). Use it when the user names AnyRouter
  or wants a drop-in gateway.
- **Cloudflare AI Gateway** — edge proxy adding caching, rate limiting,
  analytics, and logging in front of any provider; pairs with Workers/Agents.
- **Provider-direct** — skip the gateway when you need a single provider's
  latest features first or have strict data-residency constraints.

## Wiring pattern (OpenAI-compatible)
```ts
// Same SDK, different base URL + key
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1", // or anyrouter.dev / CF gateway URL
  apiKey: process.env.GATEWAY_API_KEY,
});
// model: "anthropic/claude-..." (provider/model form for multi-provider gateways)
```
The Vercel AI SDK, LangChain/LangGraph, and most TS/Python clients accept a
custom `baseURL`/`base_url` the same way.

## When to use a gateway
- Compare/switch models without code changes.
- Centralized cost/latency/logging across providers (feeds observability).
- Fallback + rate limiting + caching for reliability and cost.
- BYOK or org-level key management.

> Always confirm current base URLs, model id formats, and header names against
> the gateway's live docs (or its MCP server) before wiring.
