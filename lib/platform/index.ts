/**
 * Platform bindings singleton with auto-detection.
 *
 * Automatically selects the appropriate platform adapter:
 * 1. Explicitly set via `setPlatformBindings()` (testing/config)
 * 2. Cloudflare Workers (when `CLOUDFLARE_WORKERS` env is set)
 * 3. In-memory fallback (default)
 *
 * Usage:
 * ```typescript
 * import { getPlatformBindings } from '@/lib/platform'
 *
 * const db = getPlatformBindings().getD1Database('CONVERSATIONS_D1')
 * ```
 */

import type { PlatformBindings } from './types'

import { CloudflarePlatformBindings } from './adapters/cloudflare'
import { MemoryPlatformBindings } from './adapters/memory'

let instance: PlatformBindings | null = null

/**
 * Explicitly set the platform bindings instance.
 *
 * Use this in tests or during app initialization to override
 * auto-detection.
 */
export function setPlatformBindings(bindings: PlatformBindings): void {
  instance = bindings
}

/**
 * Get the current platform bindings.
 *
 * Auto-detects the platform on first call:
 * - Cloudflare Workers environment → CloudflarePlatformBindings
 * - Otherwise → MemoryPlatformBindings (returns null for all bindings)
 */
export function getPlatformBindings(): PlatformBindings {
  if (instance) return instance

  const isCloudflare =
    process.env.CLOUDFLARE_WORKERS === '1' || process.env.MINIFLARE === '1'

  if (isCloudflare) {
    instance = new CloudflarePlatformBindings()
  } else {
    instance = new MemoryPlatformBindings()
  }

  return instance
}

/**
 * Reset the singleton (for testing).
 */
export function resetPlatformBindings(): void {
  instance = null
}

export type { PlatformBindings } from './types'
