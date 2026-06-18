import { createFileRoute } from '@tanstack/react-router'

// Lightweight process-alive response shared by /healthz and /heathz (typo alias).
// Returns 200 as long as the Node process is running — no ClickHouse ping.
// /api/healthz is the full readiness check (includes ClickHouse reachability).
export const healthzHandler = {
  GET: () =>
    new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
    }),
}

export const Route = createFileRoute('/healthz')({
  server: { handlers: healthzHandler },
})
