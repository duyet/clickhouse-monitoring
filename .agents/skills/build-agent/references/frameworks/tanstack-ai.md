# TanStack AI

Provider-agnostic, **type-safe** AI toolkit for TS/JS apps: streaming, tool
calling, structured output, and multimodal content, with first-class framework
adapters (React, Solid, etc.) in the TanStack style. Headless and composable.

**Live docs:** https://tanstack.com/ai · host skills: `tanstack-ai`,
`tanstack-start`, `tanstack-cli`

## Glossary
- **Provider-agnostic core** — one typed API over OpenAI/Anthropic/Google/etc.
- **Streaming primitives** — incremental text/tool/structured streaming.
- **Tool calling** — typed tool definitions + execution loop.
- **Framework adapters** — hooks/stores for your UI framework.
- **TanStack Start** — full-stack React framework that pairs naturally with it.

## When to choose
You're already in the TanStack ecosystem (Router/Query/Start), want maximum type
safety and a headless approach, and prefer TanStack's conventions over the
Vercel AI SDK.

## Before coding
This is a newer, fast-moving library — pull the current docs via the host
`tanstack-ai` skill or the site before writing code; don't assume API shape.
