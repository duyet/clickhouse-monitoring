'use client'

import { useQueryClient } from '@tanstack/react-query'

import { useEffect, useRef } from 'react'
import { useClerkUserId } from '@/components/assistant-ui/use-clerk-user-id'
import { clearUserConnectionsCache } from '@/lib/hooks/use-user-connections'

/**
 * Clears server-stored connection cache when the Clerk user changes or signs out.
 * Prevents another account on the same browser from seeing a prior user's hosts.
 */
export function UserConnectionsCacheGuard() {
  const queryClient = useQueryClient()
  const userId = useClerkUserId()
  const previousUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const previous = previousUserId.current
    if (previous !== undefined && previous !== userId) {
      clearUserConnectionsCache(queryClient)
    }
    previousUserId.current = userId
  }, [userId, queryClient])

  return null
}
