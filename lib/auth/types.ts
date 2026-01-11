/**
 * Auth types - placeholder types until Better Auth is installed
 *
 * These types will be replaced by Better Auth's generated types once installed:
 * bun add better-auth
 *
 * After installation, these types should be imported from better-auth.ts:
 * export type { User, Session, Organization } from './better-auth'
 */

// Re-export Role from permissions to avoid duplication
export type { Role } from './permissions'

export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  userId: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  createdAt: Date
  updatedAt: Date
}
