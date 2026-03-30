/**
 * In-memory platform adapter (dev/testing fallback).
 *
 * Returns null for all bindings since no platform services
 * are available outside of Cloudflare Workers.
 */

import type { PlatformBindings } from '../types'

export class MemoryPlatformBindings implements PlatformBindings {
  getD1Database(_bindingName: string): null {
    return null
  }
}
