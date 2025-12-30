'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { useHostId } from '@/lib/swr'
import type { BadgeVariant } from '@/types/badge-variant'

export interface CountBadgeProps {
  /** Key for fetching count from /api/v1/menu-counts/[key] */
  countKey?: string
  className?: string
  variant?: BadgeVariant
}

/**
 * Client-side count badge that fetches count via secure API.
 * Uses countKey to fetch from /api/v1/menu-counts/[key] endpoint.
 * No raw SQL is sent from the client - security by design.
 */
export function CountBadge({
  countKey,
  className,
  variant = 'outline',
}: CountBadgeProps) {
  const hostId = useHostId()
  const [count, setCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!countKey) {
      setIsLoading(false)
      return
    }

    async function fetchCount() {
      try {
        // Use the secure menu-counts endpoint with countKey
        const response = await fetch(
          `/api/v1/menu-counts/${encodeURIComponent(countKey!)}?hostId=${hostId}`
        )
        if (!response.ok) {
          setCount(null)
          return
        }

        const result = (await response.json()) as {
          success: boolean
          data?: { count: number | null }
        }
        if (result.success && result.data && result.data.count !== null) {
          setCount(result.data.count)
        } else {
          setCount(null)
        }
      } catch {
        setCount(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCount()
  }, [countKey, hostId])

  if (isLoading || !count || count === 0) return null

  return (
    <Badge className={className} variant={variant}>
      {count}
    </Badge>
  )
}
