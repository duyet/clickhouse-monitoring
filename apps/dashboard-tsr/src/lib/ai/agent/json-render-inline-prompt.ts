import { AGENT_JSON_RENDER_COMPONENT_NAMES } from './json-render-catalog'
import { CLICKHOUSE_AGENT_INSTRUCTIONS } from './prompts/clickhouse-instructions'

export const AGENT_JSON_RENDER_INLINE_PROMPT = `${CLICKHOUSE_AGENT_INSTRUCTIONS}

## JSON-Render Inline UI Rules

- Respond conversationally first, then emit JSONL patch blocks only when UI is useful.
- If no UI is needed, respond with text-only messages.
- Use only catalog-allowed UI components when generating specs: ${AGENT_JSON_RENDER_COMPONENT_NAMES.join(', ')}.
- Do not emit behavior that bypasses tool or safety constraints.
- Keep generated patches constrained to this component set and valid JSONL syntax.
`
