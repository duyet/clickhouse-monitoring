// Anonymous environment dimensions for telemetry events.
//
// All helpers are pure (no side effects, no network) and safe to call on both
// the client and the server. They return undefined / 'unknown' rather than
// throwing when data is absent.
//
// Redaction safety contract:
//   - `getDeployTarget()` returns a short enum string (e.g. 'cf', 'docker').
//   - `parseMajorMinor()` returns at most "MAJOR.MINOR" (e.g. '24.8') —
//     never a 4-part version like '24.8.1.2' which would collide with the
//     IPv4 redaction pattern in redact.ts.
//   - `detectChFlavor()` returns a short enum string.
// None of these values match the email/IPv4/IPv6/URL patterns in redact.ts.

export type DeployTarget = 'docker' | 'helm' | 'cf' | 'dev' | 'unknown'
export type ChFlavor = 'oss' | 'altinity' | 'cloud' | 'unknown'

/**
 * Returns the deployment target inlined at build time via VITE_DEPLOY_TARGET.
 * Falls back to 'unknown' when the var is absent (e.g. local dev without it
 * set, or a Docker build that doesn't set it yet).
 */
export function getDeployTarget(): DeployTarget {
  const raw = import.meta.env.VITE_DEPLOY_TARGET?.trim().toLowerCase()
  const VALID: DeployTarget[] = ['docker', 'helm', 'cf', 'dev', 'unknown']
  if (raw && (VALID as string[]).includes(raw)) return raw as DeployTarget
  return 'unknown'
}

/**
 * Extracts the "MAJOR.MINOR" portion from a ClickHouse version string.
 *
 * Examples:
 *   parseMajorMinor('24.8.1.2')           → '24.8'
 *   parseMajorMinor('24.8')               → '24.8'
 *   parseMajorMinor('24.8.5.7-altinity') → '24.8'
 *   parseMajorMinor('')                   → undefined
 *   parseMajorMinor(null)                 → undefined
 *
 * Returning only MAJOR.MINOR (never the full 4-part version) is intentional:
 * a string like '24.8.1.2' matches the IPv4 redaction regex and would be
 * silently dropped before reaching the telemetry sink.
 */
export function parseMajorMinor(
  version: string | null | undefined
): string | undefined {
  if (!version) return undefined
  const match = version.match(/^(\d+)\.(\d+)/)
  if (!match) return undefined
  return `${match[1]}.${match[2]}`
}

/**
 * Best-effort ClickHouse flavor detection from the version() string.
 *
 * - 'altinity' — version contains "altinity" (case-insensitive).
 * - 'oss'      — version looks like a normal semver / 4-part number.
 * - 'unknown'  — version is absent or unparseable.
 *
 * Note on 'cloud': ClickHouse Cloud version strings are not reliably
 * distinguishable from community builds via version() alone (they look like
 * normal 4-part versions). We do NOT guess 'cloud' here to avoid false
 * positives — if a reliable cloud marker is found in the future, add it then.
 */
export function detectChFlavor(version: string | null | undefined): ChFlavor {
  if (!version) return 'unknown'
  if (version.toLowerCase().includes('altinity')) return 'altinity'
  // Accept any string that starts with digits (a version number)
  if (/^\d/.test(version.trim())) return 'oss'
  return 'unknown'
}
