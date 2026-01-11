/**
 * Client-side authentication hooks and context using Better Auth
 */

import { createClient } from 'better-auth/react'
import { env } from '../env'

// Create Better Auth client
export const authClient = createClient({
  baseURL: env.BETTER_AUTH_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Export auth hooks
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useAuth,
} = authClient

// Custom hooks for application-specific needs
export const useAuthState = () => {
  const session = useSession()

  return {
    ...session,
    isAuthenticated: session.data?.session !== null,
    isLoading: session.isLoading,
    user: session.data?.session?.user,
    session: session.data?.session,
  }
}

// Organization-related hooks
export const useOrganizations = () => {
  const session = useSession()

  return {
    organizations: session.data?.organizations || [],
    isLoading: session.isLoading,
    refresh: session.refetch,
  }
}

// Permission checking hook
export const usePermissions = () => {
  const session = useSession()
  const user = session.data?.user

  return {
    canManageOrganization: (organizationId: string) => {
      // Check if user has permission to manage this organization
      const orgMembership = session.data?.organizations?.find(
        org => org.id === organizationId
      )
      return orgMembership?.role === 'owner' || orgMembership?.role === 'admin'
    },
    canManageHosts: (organizationId: string) => {
      const orgMembership = session.data?.organizations?.find(
        org => org.id === organizationId
      )
      return orgMembership?.role === 'owner' || orgMembership?.role === 'admin'
    },
    isAuthenticated: user !== undefined,
    user,
  }
}

// Auth provider context for React components
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return children
}

// Error handling for auth operations
export const handleAuthError = (error: any) => {
  if (error?.message) {
    switch (error.message) {
      case 'Email already exists':
        return 'This email is already registered'
      case 'Invalid email or password':
        return 'Invalid email or password'
      case 'Session expired':
        return 'Your session has expired. Please log in again'
      case 'Email not verified':
        return 'Please verify your email address'
      default:
        return error.message || 'An error occurred'
    }
  }

  return 'An unexpected error occurred'
}

// Rate limiting helpers
export const useRateLimit = () => {
  const [attempts, setAttempts] = React.useState(0)
  const [blocked, setBlocked] = React.useState(false)

  const checkRateLimit = (type: 'login' | 'register') => {
    if (blocked) {
      return false
    }

    // Implement client-side rate limiting check
    // This is simplified - in production, you'd want server-side rate limiting
    return true
  }

  const incrementAttempts = () => {
    setAttempts(prev => prev + 1)
  }

  return {
    attempts,
    blocked,
    checkRateLimit,
    incrementAttempts,
    resetAttempts: () => {
      setAttempts(0)
      setBlocked(false)
    },
  }
}