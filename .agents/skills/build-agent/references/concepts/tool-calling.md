# Tool calling

Tools let an agent take actions: the model emits a structured call, your code
executes it, the result goes back into the loop. The mechanics are similar
across frameworks; the wrappers differ.

## Core anatomy
- **Schema** — name + description + typed input schema (JSON Schema / Zod /
  Pydantic). The description is prompt: be precise about *when* to use it.
- **Execute** — your function runs the side effect, returns a result.
- **Loop** — model → tool call → result → model, until it stops
  (`stopWhen` / `maxSteps` / no more calls).

## Per framework (verify live before coding)
- **AI SDK**: `tool({ description, inputSchema: z…, execute })`; loop via
  `stopWhen` / `maxSteps`.
- **LangGraph**: `@tool` (Python) / `tool` (JS) or bind tools to the model node;
  prebuilt ReAct agent wires the loop.
- **Claude Agent SDK**: built-in tools + custom tools + MCP servers as tools.
- **Google ADK**: plain functions as tools, plus built-ins and MCP.
- **Cloudflare Agents**: tools inside the Agent, often calling Workers bindings.

## Good practice
- **Validate inputs** — never trust model-generated args; parse against the schema.
- **Keep tools small & composable** — one clear action each.
- **Parallel calls** — allow when independent; await all.
- **Errors are data** — return structured errors so the model can recover, but
  fail loud on programmer errors.
- **MCP** — for reusable/external tools, expose them via an MCP server rather
  than hardcoding; most frameworks above can consume MCP.
- **Guard side effects** — confirm/permission-gate destructive actions.
