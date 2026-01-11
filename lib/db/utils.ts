/**
 * Database utilities for common operations
 * Encryption, ID generation, timestamp handling
 */

import { randomBytes } from 'node:crypto'

/**
 * Generate a unique ID using crypto
 */
export function generateId(prefix?: string): string {
  const id = randomBytes(12).toString('hex')
  return prefix ? `${prefix}_${id}` : id
}

/**
 * Generate organization ID
 */
export function generateOrgId(): string {
  return generateId('org')
}

/**
 * Generate member ID
 */
export function generateMemberId(): string {
  return generateId('mem')
}

/**
 * Generate ClickHouse host ID
 */
export function generateHostId(): string {
  return generateId('host')
}

/**
 * Generate audit log ID
 */
export function generateAuditId(): string {
  return generateId('audit')
}

/**
 * @deprecated Use `encryptPassword` from `lib/auth/encryption.ts` instead
 * This XOR-based encryption is insecure and will be removed in a future version
 *
 * Encrypt password using simple XOR with key
 * NOTE: Use proper encryption in production (bcrypt, argon2, etc.)
 */
export function encryptPassword(password: string): string {
  const key = process.env.DB_ENCRYPTION_KEY || 'default-insecure-key'

  // Simple XOR encryption (NOT FOR PRODUCTION)
  // For production, use: bcrypt, argon2, or crypto module
  let encrypted = ''
  for (let i = 0; i < password.length; i++) {
    encrypted += String.fromCharCode(
      password.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    )
  }
  return Buffer.from(encrypted, 'binary').toString('base64')
}

/**
 * @deprecated Use `decryptPassword` from `lib/auth/encryption.ts` instead
 * This XOR-based decryption is insecure and will be removed in a future version
 *
 * Decrypt password
 * NOTE: Use proper decryption in production
 */
export function decryptPassword(encrypted: string): string {
  const key = process.env.DB_ENCRYPTION_KEY || 'default-insecure-key'

  // Simple XOR decryption (NOT FOR PRODUCTION)
  const decrypted = Buffer.from(encrypted, 'base64').toString('binary')
  let password = ''
  for (let i = 0; i < decrypted.length; i++) {
    password += String.fromCharCode(
      decrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    )
  }
  return password
}

/**
 * Validate organization slug
 * Only alphanumeric, hyphens, and underscores
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-_]{3,50}$/.test(slug)
}

/**
 * Generate slug from name
 */
export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Member role hierarchy for authorization checks
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0)
}

/**
 * Audit log action types
 */
export const AUDIT_ACTIONS = {
  // Organization
  ORG_CREATED: 'org:created',
  ORG_UPDATED: 'org:updated',
  ORG_DELETED: 'org:deleted',

  // Members
  MEMBER_ADDED: 'member:added',
  MEMBER_UPDATED: 'member:updated',
  MEMBER_REMOVED: 'member:removed',

  // ClickHouse Hosts
  HOST_ADDED: 'host:added',
  HOST_UPDATED: 'host:updated',
  HOST_DELETED: 'host:deleted',
  HOST_TESTED: 'host:tested',

  // Authentication
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  SESSION_EXPIRED: 'auth:session-expired',
} as const

/**
 * Create audit log metadata
 */
export function createAuditMetadata(data: Record<string, unknown>): string {
  return JSON.stringify(data)
}

/**
 * Parse audit log metadata
 */
export function parseAuditMetadata(
  metadata: string | null
): Record<string, unknown> {
  if (!metadata) return {}
  try {
    return JSON.parse(metadata)
  } catch {
    return {}
  }
}
