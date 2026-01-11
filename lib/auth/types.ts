/**
 * Auth types - canonical type definitions for the auth module
 *
 * All auth-related types should be imported from this file to avoid duplication.
 * These types align with Better Auth's data structures.
 */

// Re-export Role from permissions to avoid duplication
export type { Permission, Role } from './permissions'

/**
 * User information from Better Auth
 */
export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Session information from Better Auth
 * Contains both user and session details
 */
export interface Session {
  user: User
  session: {
    id: string
    userId: string
    expiresAt: Date
    createdAt?: Date
    updatedAt?: Date
  }
}

/**
 * Raw session record (database representation)
 */
export interface SessionRecord {
  id: string
  userId: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  user: User
}

/**
 * Organization information from Better Auth
 */
export interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Organization member with role
 */
export interface OrganizationMember {
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  createdAt?: Date
}

/**
 * Auth context for host resolution and middleware
 */
export interface AuthContextSession {
  userId: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'guest'
}

/**
 * Authentication context for API routes
 */
export interface AuthContext {
  session: AuthContextSession | null
  organizationId?: string
}
