// Cloud (SaaS) PUBLIC DEMO host allowlist.
//
// In cloud mode the operator-configured `CLICKHOUSE_HOST` env list is the
// PUBLIC, READ-ONLY demo an anonymous visitor explores (see cloud-mode.ts /
// use-merged-hosts.ts). A deploy may bind more env hosts than it wants to expose
// publicly, so `CHM_CLOUD_DEMO_HOSTS` narrows the demo to a named subset:
//
//   CHM_CLOUD_DEMO_HOSTS=duet-ubuntu   → anonymous visitors see ONLY that host.
//
// Match is by host NAME (CLICKHOUSE_NAME entry) or the sanitized host string,
// case-insensitive. The original host `id` (index into CLICKHOUSE_HOST) is
// preserved so `?host=<id>` routing and per-host queries keep resolving.
//
// Design invariants (mirror lib/cloud, lib/edition — fail-open, never degrade):
//   - Only active in cloud mode. Self-hosted/OSS ignores the var entirely.
//   - Unset / empty allowlist  → no restriction (all env hosts, unchanged).
//   - Allowlist matches ZERO hosts → treated as misconfiguration; passthrough
//     ALL hosts rather than black out the demo (an empty host list is a 503).

import { isCloudModeServer } from '@/lib/cloud/cloud-mode'

/**
 * Parse `CHM_CLOUD_DEMO_HOSTS` into a lowercased name set, or `null` when unset
 * /empty (meaning "no restriction"). Pure — pass any env getter.
 */
export function parseDemoHostAllowlist(
  bindings: Record<string, string | undefined>
): Set<string> | null {
  const raw = bindings.CHM_CLOUD_DEMO_HOSTS
  if (!raw?.trim()) return null
  const names = raw
    .split(',')
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean)
  return names.length > 0 ? new Set(names) : null
}

/** Does a host (by name and/or host string) match an allowlist entry? */
function isAllowed(
  allow: Set<string>,
  name: string | undefined,
  host: string | undefined
): boolean {
  const n = name?.trim().toLowerCase()
  if (n && allow.has(n)) return true
  const h = host?.trim().toLowerCase()
  if (h && allow.has(h)) return true
  return false
}

/**
 * Filter an env-derived host list to the cloud public-demo allowlist.
 *
 * Returns the input unchanged when not in cloud mode or when no allowlist is
 * set. When the allowlist matches at least one host, returns only the matches
 * (original order/ids preserved). When it matches NONE, returns the input
 * unchanged (fail-open — never empty the demo on a misconfigured name).
 *
 * Generic over any host shape via accessors so the same rule serves both the
 * `/api/v1/hosts` list and the server `ClickHouseConfig[]` resolver.
 */
export function filterToDemoHosts<T>(
  hosts: readonly T[],
  bindings: Record<string, string | undefined>,
  accessors: {
    name: (h: T) => string | undefined
    host: (h: T) => string | undefined
  }
): T[] {
  const list = [...hosts]
  if (!isCloudModeServer(bindings)) return list

  const allow = parseDemoHostAllowlist(bindings)
  if (!allow) return list

  const matched = list.filter((h) =>
    isAllowed(allow, accessors.name(h), accessors.host(h))
  )
  // Fail-open: an allowlist that matches nothing is almost certainly a typo;
  // showing all hosts is far safer than serving a 503 "no hosts configured".
  return matched.length > 0 ? matched : list
}
