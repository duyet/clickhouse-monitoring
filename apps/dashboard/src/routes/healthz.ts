import { createFileRoute } from '@tanstack/react-router'

// Lightweight process-alive endpoint for K8s liveness probes.
// Returns 200 as long as the Node process is running — no ClickHouse ping.
// /api/healthz is the full readiness check (includes ClickHouse reachability).
export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: () =>
        new Response('OK', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store',
          },
        }),
    },
  },
})
