'use client'

/**
 * AuthProvider component - a simple wrapper for consistent API
 *
 * Note: Better Auth uses nanostores for reactive state management,
 * so no actual provider wrapper is needed. Components can use
 * authClient.useSession() directly. This component exists for
 * consistency and potential future provider needs.
 *
 * Usage in root layout:
 * <AuthProvider>
 *   <YourApp />
 * </AuthProvider>
 */

import type { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Better Auth uses nanostores internally - no provider wrapper needed
  // useSession() works directly from authClient
  return <>{children}</>
}
