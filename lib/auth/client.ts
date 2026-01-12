'use client'

import { createClient } from 'better-auth/react'
import { useState, useEffect } from 'react'

export const authClient = createClient({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
})

export function useAuth() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: session, isLoading, signOut, signIn } = authClient.useSession()

  return {
    session,
    isLoading: isLoading || !mounted,
    signOut,
    signIn,
  }
}

export function useIsAuthenticated() {
  const { session, isLoading } = useAuth()
  return {
    isAuthenticated: !!session,
    isLoading,
  }
}
