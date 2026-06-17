// Telemetry enablement gate. OFF by default — telemetry runs only when it is
// explicitly turned on, and makes ZERO network calls otherwise.
//
// Dual-source, mirroring lib/env.ts so the on/off semantics survive both the
// Node and the Cloudflare Worker runtime:
//   - Server: runtime CHM_TELEMETRY (Worker binding / process.env).
//   - Client: build-time VITE_TELEMETRY_ENABLED (inlined by vite.config.ts).
//
// Canonical enabling value is `on` (i.e. CHM_TELEMETRY=on). `true`/`1`/`yes`
// are also accepted for convenience. Anything else — including unset — is OFF.

const ENABLED_VALUES = new Set(['on', 'true', '1', 'yes'])

export function parseTelemetryFlag(value: string | null | undefined): boolean {
  if (value == null) return false
  return ENABLED_VALUES.has(value.trim().toLowerCase())
}

export function isTelemetryEnabled(
  runtimeEnv?: Record<string, string | undefined>
): boolean {
  const source =
    runtimeEnv ?? (typeof process !== 'undefined' ? process.env : {})
  return parseTelemetryFlag(
    source.CHM_TELEMETRY ?? import.meta.env.VITE_TELEMETRY_ENABLED
  )
}
