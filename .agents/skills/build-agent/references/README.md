# references — thin glossary + live-doc index

These files are intentionally small. They tell you **what each framework/concept
is and where the authoritative, up-to-date docs live**. Always fetch the live
docs (Context7 / `llms.txt` / WebFetch) before writing framework code — the
snippets here are illustrative and may lag the latest release.

## Frameworks
| Framework | File | Official docs / llms |
|-----------|------|----------------------|
| LangGraph | `frameworks/langgraph.md` | https://langchain-ai.github.io/langgraph/ · llms.txt: https://langchain-ai.github.io/langgraph/llms.txt |
| DeepAgents | `frameworks/deepagents.md` | https://github.com/langchain-ai/deepagents · JS: https://github.com/langchain-ai/deepagentsjs |
| Vercel AI SDK | `frameworks/ai-sdk.md` | https://ai-sdk.dev/docs · llms: https://ai-sdk.dev/llms.txt |
| Cloudflare Agents SDK | `frameworks/cloudflare-agents.md` | https://developers.cloudflare.com/agents/ · llms: https://developers.cloudflare.com/agents/llms-full.txt |
| TanStack AI | `frameworks/tanstack-ai.md` | https://tanstack.com/ai |
| Google ADK | `frameworks/google-adk.md` | https://google.github.io/adk-docs/ · llms: https://google.github.io/adk-docs/llms.txt |
| Claude Agent SDK | `frameworks/claude-agent-sdk.md` | https://docs.claude.com/en/api/agent-sdk/overview |

## Cross-cutting concepts
| Concept | File |
|---------|------|
| Building skills for agents | `concepts/skills.md` |
| Tool calling | `concepts/tool-calling.md` |
| Tracking / observability | `concepts/tracking-observability.md` |
| AI gateways (OpenRouter / AnyRouter / AI gateway) | `concepts/ai-gateways.md` |

## Model engineering / prompting
| Model family | File |
|--------------|------|
| Claude (Anthropic) | `engineering/claude.md` |
| Gemini (Google) | `engineering/gemini.md` |
| GPT (OpenAI) | `engineering/gpt.md` |

> Maintenance note: keep these files to glossary depth. If a section starts to
> mirror full API docs, trim it and link out instead — staleness is the enemy.
