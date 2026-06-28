import { createFileRoute } from '@tanstack/react-router'

import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

// Orama full-text search server. Index is built from the Fumadocs source at
// request time. See: https://docs.orama.com/docs/orama-js/supported-languages
const server = createFromSource(source, { language: 'english' })

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }) => server.GET(request),
    },
  },
})
