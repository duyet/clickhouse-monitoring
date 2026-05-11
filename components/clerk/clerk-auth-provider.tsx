'use client'

import type { ReactNode } from 'react'

import { ClerkProvider } from '@clerk/nextjs'
import { isClerkEnabled } from '@/lib/clerk/clerk-client'

interface ClerkAuthProviderProps {
  children: ReactNode
}

export function ClerkAuthProvider({ children }: ClerkAuthProviderProps) {
  if (!isClerkEnabled()) {
    return children
  }

  return <ClerkProvider>{children}</ClerkProvider>
}
