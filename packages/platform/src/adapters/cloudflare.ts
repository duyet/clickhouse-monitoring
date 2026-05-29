/**
 * Cloudflare Workers platform adapter.
 *
 * This is the ONLY file that should import from `@opennextjs/cloudflare`.
 * It wraps `getCloudflareContext()` to provide D1 database bindings
 * through the PlatformBindings interface.
 */

import type { PlatformBindings } from '../types'

import { getCloudflareContext } from '@opennextjs/cloudflare'

export class CloudflarePlatformBindings implements PlatformBindings {
  getD1Database(bindingName: string): D1Database | null {
    try {
      const ctx = getCloudflareContext()

      if (ctx?.env && bindingName in ctx.env) {
        const env = ctx.env as unknown as Record<string, unknown>
        return env[bindingName] as D1Database
      }

      return null
    } catch {
      return null
    }
  }
}
