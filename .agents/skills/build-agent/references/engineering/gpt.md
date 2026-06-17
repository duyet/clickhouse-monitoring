# Engineering for GPT (OpenAI)

Prompting and agent patterns for OpenAI GPT models. Host skill: `grok-prompting`
covers xAI; for GPT use OpenAI docs / Context7. Codex-style coding agents use
the host `codex` skills.

## Strengths
- Mature function calling + structured outputs (JSON schema / strict mode).
- Responses API + tools (web search, file search, code interpreter).
- Broad ecosystem and tooling; strong general reasoning.

## Prompting patterns
- **System message sets role/policy**; keep it crisp.
- **Structured output** — use JSON schema / `response_format` strict mode for
  reliable machine-readable results.
- **Function calling** — precise parameter schemas; the model picks and fills.
- **Reasoning models** (o-series / GPT reasoning tiers) — give the goal and let
  them reason; avoid over-prescribing chain-of-thought.
- **Developer vs user messages** — separate instructions from user content.

## Access
Direct (`api.openai.com`) or via a gateway (OpenAI-compatible — see
`ai-gateways.md`). Verify current model ids and the Responses/Chat API surface
against OpenAI's live docs before coding.
