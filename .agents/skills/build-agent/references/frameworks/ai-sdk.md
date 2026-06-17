# Vercel AI SDK

TypeScript toolkit for building AI apps: unified provider API, streaming, tool
calling, structured output, agents, and React/Svelte/Vue UI hooks. The default
choice for **web apps with streaming chat and generative UI**.

**Live docs:** https://ai-sdk.dev/docs · llms.txt: https://ai-sdk.dev/llms.txt ·
npm `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, …

## Glossary
- **`generateText` / `streamText`** — core text generation (await vs stream).
- **`generateObject` / `streamObject`** — structured output against a Zod schema.
- **`tool()`** — define a typed tool with `inputSchema` + `execute`.
- **`Agent` / tool loop** — multi-step tool-calling loop (`stopWhen`/`maxSteps`).
- **Provider packages** — swap models by changing one import; works with gateways.
- **AI SDK UI** (`useChat`, `useCompletion`) — React/Svelte/Vue streaming hooks.
- **AI Elements** — prebuilt chat UI components (host skill: `ai-elements`).
- **Generative UI** — stream React components as tool results.

## When to choose
Next.js / React (or Svelte/Vue) app, streaming chat, tool calls, generative UI,
provider flexibility. Often the **frontend** for a LangGraph or Claude Agent SDK
backend.

## Before coding
Use the host's `ai-sdk` / `ai-elements` skills if present, else Context7 (`ai`).
APIs like `maxSteps`→`stopWhen` have changed across majors — verify the version.
