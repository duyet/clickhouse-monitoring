import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'

// Server (API) route — current convention: a normal createFileRoute whose
// config carries a `server.handlers` map. Any route file with a `server`
// property is treated as a server route. Demonstrates reading a Worker
// binding without leaking its value (public repo).
export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const bindings = env as Record<string, string | undefined>
        return Response.json({
          message: 'Hello from TanStack Start on Cloudflare Workers',
          url: request.url,
          clickhouseHostConfigured: Boolean(bindings.CLICKHOUSE_HOST),
        })
      },
    },
  },
})
