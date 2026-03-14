/**
 * Shared utilities for migration system.
 */

/**
 * Calculate checksum for migration content.
 * Uses DJB2 hash algorithm for consistency.
 *
 * @param content - Migration SQL or script path
 * @returns Hexadecimal checksum string
 */
export function calculateChecksum(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

/**
 * Get platform info for migration records.
 * Centralized to ensure consistency across storage backends.
 *
 * @param platformType - Platform identifier (e.g., 'local', 'node-server', 'cloudflare-workers')
 * @returns Platform info object
 */
export function getPlatformInfo(platformType: string): {
  platform: string
  environment: string
} {
  return {
    platform: platformType,
    environment: process.env.NODE_ENV || 'development',
  }
}
