# Engineering for Claude (Anthropic)

Prompting and agent patterns tuned for Claude models. Host skills:
`claude-prompting`, `claude-api`; SDK: `claude-agent-sdk`.

## Model ids (verify current via `claude-api` skill / docs)
- Opus 4.8 `claude-opus-4-8`, Sonnet 4.6 `claude-sonnet-4-6`,
  Haiku 4.5 `claude-haiku-4-5-...`, Fable 5 `claude-fable-5`.
- Choose by need: Opus for hard reasoning, Sonnet for balanced, Haiku for
  cheap/mechanical, Fable for visual/frontend taste.

## Prompting patterns
- **System prompt = role + rules**; keep stable for prompt caching.
- **XML tags** to structure inputs/outputs (`<context>`, `<example>`).
- **Be explicit & direct** — state what to do and the success criteria.
- **Think before answering** — allow reasoning for complex tasks; use extended
  thinking where supported.
- **Few-shot** with realistic examples beats abstract instructions.
- **Tool use** — precise tool descriptions; Claude follows schemas well.

## Agent/cost patterns
- **Prompt caching** — put long stable context (system, docs, tools) first to
  cache it; big cost/latency win for agents.
- **Parallel tool calls** — Claude will batch independent calls.
- **Subagents** — delegate scoped work (Claude Agent SDK) to keep context clean.

Always verify model availability, pricing, and API params with the `claude-api`
skill — don't answer from memory.
