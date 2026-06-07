/**
 * Unified environment variable reader for CHM apps.
 *
 * Provides a consistent interface for reading env vars across:
 * - Cloudflare Workers (binding-first, process.env fallback)
 * - Node.js (process.env only)
 *
 * Includes legacy fallback support for the v0.3 env var rename:
 * new names are tried first, old names cascade as fallbacks.
 */

type EnvBindings = Record<string, string | undefined>

/**
 * Function that reads an env var by name.
 * Used by parseLegacyFeatureOverrides and other env-dependent code.
 */
export type EnvReader = {
  get(key: string): string | undefined
}

/**
 * Create an env reader that checks Cloudflare Worker bindings first,
 * then falls back to process.env.
 *
 * @param bindings - Cloudflare Worker env bindings (from `cloudflare:workers`)
 */
export function createEnvReader(bindings?: EnvBindings | null): EnvReader {
  return {
    get(key: string): string | undefined {
      // 1. Cloudflare Worker binding (if available)
      if (bindings && bindings[key] !== undefined && bindings[key] !== '') {
        return bindings[key]
      }
      // 2. process.env (Node.js / dev server)
      if (typeof process !== 'undefined' && process.env) {
        const v = process.env[key]
        if (v !== undefined && v !== '') return v
      }
      return undefined
    },
  }
}

/**
 * Read an env var with legacy fallback cascade.
 *
 * Tries each name in order: first the new canonical name, then legacy aliases.
 * Returns the first non-empty value found.
 *
 * @example
 * // CHM_AUTH_PROVIDER → NEXT_PUBLIC_AUTH_PROVIDER → undefined
 * readEnvWithFallback(reader, 'CHM_AUTH_PROVIDER', ['NEXT_PUBLIC_AUTH_PROVIDER'])
 */
export function readEnvWithFallback(
  reader: EnvReader,
  newName: string,
  legacyNames: string[] = []
): string | undefined {
  const newValue = reader.get(newName)
  if (newValue !== undefined) return newValue

  for (const name of legacyNames) {
    const value = reader.get(name)
    if (value !== undefined) return value
  }

  return undefined
}
