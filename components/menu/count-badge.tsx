'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { useHostId } from '@/lib/swr'
import type { BadgeVariant } from '@/types/badge-variant'

export interface CountBadgeProps {
  sql?: string
  className?: string
  variant?: BadgeVariant
}

/**
 * Client-side count badge that fetches count via API.
 * For static site architecture with query parameter routing.
 */
export function CountBadge({
  sql,
  className,
  variant = 'outline',
}: CountBadgeProps) {
  const hostId = useHostId()
  const [count, setCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!sql) {
      setIsLoading(false)
      return
    }

    async function fetchCount() {
      try {
        // Use the data endpoint for count queries
        const response = await fetch(
          `/api/v1/data?hostId=${hostId}&sql=${encodeURIComponent(sql!)}`
        )
        if (!response.ok) {
          setCount(null)
          return
        }

        const result = await response.json() as { success: boolean; data?: Array<{ 'count()'?: string | number; count?: string | number }> }
        if (result.success && result.data && result.data.length > 0) {
          const value = result.data[0]['count()'] || result.data[0].count
          const parsed = typeof value === 'string' ? parseInt(value, 10) : value
          setCount(typeof parsed === 'number' && !Number.isNaN(parsed) ? parsed : null)
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
  }, [sql, hostId])

  if (isLoading || !count || count === 0) return null

  return (
    <Badge className={className} variant={variant}>
      {count}
    </Badge>
  )
}
