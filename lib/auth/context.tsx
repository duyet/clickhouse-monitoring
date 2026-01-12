'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSession } from 'better-auth/react'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role: string
  emailVerified: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession()
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            avatar: session.user.image,
            role: session.user.role || 'user',
            emailVerified: session.user.emailVerified || false,
          })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Set up periodic session refresh
    const interval = setInterval(checkAuth, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/login'
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = `${redirectTo}?redirectTo=${encodeURIComponent(window.location.pathname)}`
      }
    }, [isLoading, isAuthenticated, redirectTo])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null // Will redirect in useEffect
    }

    return <Component {...props} />
  }
}