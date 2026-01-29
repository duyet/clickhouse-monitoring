/**
 * Re-export custom schema tables
 * Uses SQLite schema by default (compatible with D1)
 * Note: Better Auth manages organization and member tables via its organization plugin
 */

export * from './auth'
// Re-exports for convenience
export { auditLog, clickhouseHost } from './auth'
