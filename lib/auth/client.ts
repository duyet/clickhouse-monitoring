/**
 * Better Auth React client for authentication and session management
 *
 * NOTE: This file requires 'better-auth' package to be installed:
 * bun add better-auth
 */

import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

/**
 * User type from Better Auth session
 */
export interface AuthUser {
  id: string
  email: string
  name: string | null
  image: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Session type from Better Auth
 */
export interface AuthSession {
  user: AuthUser
  session: {
    id: string
    userId: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
  }
}

/**
 * Error response from Better Auth API
 */
interface BetterAuthError {
  error: {
    status: number
    message: string
  }
}

/**
 * Better Auth client instance with organization support
 * Provides React hooks for authentication and session management
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || '',

  plugins: [organizationClient()],

  fetchOptions: {
    onError(error: BetterAuthError) {
      if (error.error.status === 429) {
        console.error('Too many requests. Please try again later.')
      } else if (error.error.status === 401) {
        console.error('Unauthorized')
      } else {
        console.error('Auth error:', error.error.message)
      }
    },
    onSuccess(data: unknown) {
      console.log('Auth action successful:', data)
    },
  },
})

/**
 * Export commonly used hooks and utilities from authClient
 */
export const {
  // Core authentication methods
  signIn,
  signUp,
  signOut,

  // Session management hook
  useSession,

  // Organization-related exports
  organization,
  useListOrganizations,
  useActiveOrganization,
} = authClient
