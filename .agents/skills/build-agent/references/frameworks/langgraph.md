# LangGraph

Low-level orchestration framework for stateful, multi-actor agents modeled as
**graphs**. Best when you need explicit control over the agent loop, durable
state, branching, and human-in-the-loop.

**Live docs:** https://langchain-ai.github.io/langgraph/ ·
llms.txt: https://langchain-ai.github.io/langgraph/llms.txt ·
Python `langgraph` · JS `@langchain/langgraph`

## Glossary
- **StateGraph** — graph whose nodes read/write a shared, typed state.
- **Node** — a function (or runnable) that updates state.
- **Edge / conditional edge** — control flow between nodes; conditional edges
  branch on state.
- **Reducer** — how a state channel merges updates (e.g. append to messages).
- **Checkpointer** — persists state per thread → durability, resume, time-travel.
- **Command / Send** — return values that direct flow and fan-out to subgraphs.
- **Interrupt** — pause for human input (human-in-the-loop).
- **Prebuilt `create_react_agent`** — quick tool-using agent without hand-wiring.

## When to choose
Multi-agent supervisors, long-running/durable workflows, approval gates,
deterministic control flow. Pairs well with LangSmith for tracing and a UI built
on the Vercel AI SDK or a LangGraph platform server.

## Before coding
Fetch the current quickstart — node/edge and checkpointer APIs evolve. Use the
host's `langgraph-docs` / `langgraph-fundamentals` skill if available, or
Context7 (`langgraph`).
