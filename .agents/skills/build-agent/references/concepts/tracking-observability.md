# Tracking / observability

Agents are non-deterministic and multi-step — you can't improve what you can't
see. Wire tracing, evals, and cost tracking from day one.

## Three layers
1. **Tracing** — capture every step: prompts, tool calls, model outputs,
   latency, token counts, errors. A trace = one agent run as a tree of spans.
2. **Evals** — score outputs/trajectories (offline datasets + online sampling).
   Catch regressions before users do.
3. **Cost & latency** — track tokens × price per model and step; alert on spikes.

## Tools (pick what fits the stack)
- **LangSmith** — native to LangGraph/LangChain; traces, datasets, evals.
- **Langfuse** — open-source tracing + evals + prompt mgmt; framework-agnostic.
- **OpenTelemetry / OpenLLMetry** — vendor-neutral spans; export anywhere.
- **Provider dashboards** — Anthropic / OpenAI / Google consoles for raw usage.
- **Gateway analytics** — OpenRouter / AnyRouter / Cloudflare AI Gateway expose
  per-request cost, latency, and logs centrally (see `ai-gateways.md`).
- **PostHog / product analytics** — user-facing funnels and LLM analytics.

## Practical wiring
- Prefer a gateway for **centralized** cost/latency/log capture across providers.
- Add OTel spans around the agent loop and each tool for portability.
- Log a stable `trace_id` / `session_id` per run; thread it through subagents.
- Build an eval set from real traces; run it in CI on prompt/model changes.
- Never log secrets or full PII payloads.
