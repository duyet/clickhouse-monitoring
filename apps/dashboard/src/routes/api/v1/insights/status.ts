/**
 * AI Insights status endpoint — GET /api/v1/insights/status
 *
 * Lightweight, no-ClickHouse signal for the settings UI: whether LLM enrichment
 * is actually available on this deployment (a provider key resolves for the
 * default model) and which model is the server default. Lets the settings page
 * tell the operator when "Enhance with AI" will have no effect (no provider key)
 * rather than silently falling back to deterministic copy.
 *
 * Returns only booleans + the default model id — no secrets.
 */

import { createFileRoute } from '@tanstack/react-router'

import { error, generateRequestId } from '@chm/logger'
import { DEFAULT_MODEL } from '@/lib/ai/agent/provider-chat-model'
import { isLlmAvailable } from '@/lib/insights/llm-enrich'

export const Route = createFileRoute('/api/v1/insights/status')({
  server: {
    handlers: {
      GET: async () => {
        const requestId = generateRequestId()
        try {
          return Response.json(
            {
              enrichmentAvailable: isLlmAvailable(),
              defaultModel: DEFAULT_MODEL,
            },
            { headers: { 'X-Request-ID': requestId } }
          )
        } catch (err) {
          error('[GET /api/v1/insights/status] Unexpected error:', err, {
            requestId,
          })
          // Degrade to "available unknown → assume on" so the UI never blocks.
          return Response.json(
            { enrichmentAvailable: true, defaultModel: '' },
            { headers: { 'X-Request-ID': requestId } }
          )
        }
      },
    },
  },
})
