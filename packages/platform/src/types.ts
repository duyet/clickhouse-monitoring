/**
 * Platform bindings interface for dependency injection.
 *
 * Abstracts Cloudflare-specific bindings (D1, KV, R2, etc.) so that
 * consumer modules never import `@opennextjs/cloudflare` directly.
 * This enables testing, local development, and alternative deployment
 * targets without coupling to a specific platform SDK.
 *
 * The D1Database type is provided globally by cloudflare-env.d.ts.
 */

/**
 * Platform bindings abstraction.
 *
 * Implementations provide access to platform-specific resources
 * (databases, caches, storage) by binding name.
 */
export interface PlatformBindings {
  /**
   * Get a D1 database binding by name.
   *
   * @param bindingName - The binding name (e.g. 'CONVERSATIONS_D1')
   * @returns The D1Database instance, or null if not available
   */
  getD1Database(bindingName: string): D1Database | null
}
