import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { filterToDemoHosts } from '@/lib/cloud/demo-hosts'

interface HostInfo {
  id: number
  name: string
  host: string
}

// Strip credentials and query params so we never leak passwords to the client.
// Handles bare hostnames, host:port, and full URLs.
function sanitizeHost(raw: string): string {
  const trimmed = raw.trim()
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
  try {
    const url = new URL(hasScheme ? trimmed : `http://${trimmed}`)
    url.username = ''
    url.password = ''
    url.search = ''
    url.hash = ''
    return hasScheme ? url.origin : url.origin.replace(/^https?:\/\//, '')
  } catch {
    const withoutQueryOrHash = trimmed.split('?')[0].split('#')[0]
    const withoutUserInfo = withoutQueryOrHash.split('@').at(-1) ?? ''
    return withoutUserInfo.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '')
  }
}

// Parse CLICKHOUSE_HOST / CLICKHOUSE_NAME comma lists into host descriptors.
// Env-only — no ClickHouse query.
function parseHosts(
  rawHosts: string | undefined,
  rawNames: string | undefined
): HostInfo[] {
  if (!rawHosts?.trim()) return []

  const hosts = rawHosts
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
  const names = rawNames ? rawNames.split(',').map((n) => n.trim()) : []

  return hosts.map((host, i) => ({
    id: i,
    name: names[i]?.trim() || sanitizeHost(host) || `Host ${i}`,
    host: sanitizeHost(host),
  }))
}

export const Route = createFileRoute('/api/v1/hosts')({
  server: {
    handlers: {
      GET: () => {
        const bindings = env as Record<string, string | undefined>
        // In cloud mode, narrow the env hosts to the public-demo allowlist
        // (CHM_CLOUD_DEMO_HOSTS) so anonymous visitors see only the intended
        // demo host(s). No-op in self-hosted mode or when the var is unset.
        const hosts = filterToDemoHosts(
          parseHosts(bindings.CLICKHOUSE_HOST, bindings.CLICKHOUSE_NAME),
          bindings,
          { name: (h) => h.name, host: (h) => h.host }
        )

        if (hosts.length === 0) {
          return Response.json(
            {
              error:
                'No ClickHouse hosts configured. CLICKHOUSE_HOST environment variable is missing or empty.',
            },
            { status: 503 }
          )
        }

        // Host list is env-derived and constant per deploy — cache at the edge.
        return Response.json(
          { success: true, data: hosts },
          {
            headers: {
              'Cache-Control':
                'public, s-maxage=300, stale-while-revalidate=300',
            },
          }
        )
      },
    },
  },
})
