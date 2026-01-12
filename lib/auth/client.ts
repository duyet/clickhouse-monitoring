"use client"

import { createAuthClient } from "better-auth/react"
import type { Session, User } from "./config"

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
})

export const {
  signIn,
  signUp,
  signOut,
  getSession,
  getUser,
  isAuthenticated,
} = authClient

// Custom hooks for better TypeScript support
export function useAuth() {
  const session = authClient.useSession()
  const user = authClient.useUser()

  return {
    session: session.data?.session as Session | null,
    user: session.data?.user as User | null,
    isLoading: session.isLoading,
    isAuthenticated: !!session.data?.session,
    signOut: () => signOut(),
  }
}

export function useSession() {
  const session = authClient.useSession()

  return {
    session: session.data?.session as Session | null,
    user: session.data?.user as User | null,
    isLoading: session.isLoading,
    refetch: session.refetch,
  }
}

// Hook to get current organization
export function useCurrentOrganization() {
  const { session, user } = useSession()

  // This would be implemented with organization context
  // For now, return null - will be implemented with org management
  return {
    organization: null,
    isLoading: false,
  }
}

// Hook to check user permissions
export function usePermissions() {
  const { user } = useSession()

  const hasPermission = (permission: string) => {
    // Basic permission check - can be expanded
    if (!user) return false

    const role = user.role || "member"
    const permissions: Record<string, string[]> = {
      owner: ["*"], // Super user
      admin: ["hosts:read", "hosts:write", "org:read", "org:write"],
      member: ["hosts:read", "org:read"],
    }

    const userPermissions = permissions[role] || []
    return userPermissions.includes("*") || userPermissions.includes(permission)
  }

  return {
    hasPermission,
    role: user?.role || "member",
  }
}

// Hook for OAuth providers
export function useOAuthSignIn(provider: "github" | "google") {
  return () => {
    const redirectUrl = `${window.location.origin}/auth/callback`
    authClient.signIn.social({
      provider,
      callbackURL: redirectUrl,
    })
  }
}