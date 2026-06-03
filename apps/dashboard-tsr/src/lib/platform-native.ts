/**
 * Native `@chm/platform` replacement for the TanStack Start / @cloudflare/vite-plugin
 * worker (aliased to `@chm/platform` in vite.config.ts + tsconfig.json).
 *
 * The upstream `@chm/platform` resolves bindings through
 * `@opennextjs/cloudflare`'s `getCloudflareContext()`, an OpenNext-only API that does
 * not exist in a TanStack Start worker (and `@opennextjs/cloudflare` is not a
 * dependency here). This shim instead reads bindings straight from the
 * `cloudflare:workers` env — which is the real Worker env on workerd and a
 * `process.env` shim on the Node/Docker build target. D1 access therefore works on
 * Cloudflare and degrades to `null` everywhere else (the conversation store falls
 * back to its memory/client adapter when the binding is absent).
 */
import { env } from 'cloudflare:workers'

export interface PlatformBindings {
  getD1Database(bindingName: string): D1Database | null
}

export function getPlatformBindings(): PlatformBindings {
  return {
    getD1Database(bindingName: string): D1Database | null {
      const binding = (env as Record<string, unknown> | undefined)?.[
        bindingName
      ]
      // A real D1Database is an object on workerd; on the Node shim the value is
      // absent or a plain string, so we return null and let callers degrade.
      return binding && typeof binding === 'object'
        ? (binding as unknown as D1Database)
        : null
    },
  }
}
