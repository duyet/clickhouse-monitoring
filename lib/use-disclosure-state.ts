'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

/**
 * Disclosure levels for progressive disclosure pattern
 */
export type DisclosureLevel = 0 | 1 | 2 | 3

/**
 * Maximum disclosure level
 */
export const MAX_DISCLOSURE_LEVEL: DisclosureLevel = 3

/**
 * Hook to manage disclosure state with URL persistence
 *
 * This hook provides:
 * - Current disclosure level (0-3)
 * - Function to cycle to next level
 * - Function to set specific level
 * - Automatic URL sync for shareable state
 *
 * @param cardId - Unique identifier for this card (used in URL param)
 * @param initialLevel - Default level if not in URL (default: 0)
 *
 * @example
 * ```tsx
 * const { level, nextLevel, setLevel, isExpanded } = useDisclosureState('running-queries', 0)
 * ```
 */
export function useDisclosureState(
  cardId: string,
  initialLevel: DisclosureLevel = 0
): {
  /** Current disclosure level (0-3) */
  level: DisclosureLevel
  /** Cycle to next disclosure level (wraps around) */
  nextLevel: () => void
  /** Set specific disclosure level */
  setLevel: (level: DisclosureLevel) => void
  /** Whether card is expanded (level > 0) */
  isExpanded: boolean
  /** Reset to collapsed state */
  reset: () => void
} {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Build URL param key for this card
  const paramKey = `disclosure-${cardId}`

  // Read current level from URL params
  const level = useMemo<DisclosureLevel>(() => {
    const levelParam = searchParams.get(paramKey)
    if (levelParam !== null) {
      const parsed = Number.parseInt(levelParam, 10)
      if (
        !Number.isNaN(parsed) &&
        parsed >= 0 &&
        parsed <= MAX_DISCLOSURE_LEVEL
      ) {
        return parsed as DisclosureLevel
      }
    }
    return initialLevel
  }, [searchParams, paramKey, initialLevel])

  // Update URL with new level
  const setLevel = useCallback(
    (newLevel: DisclosureLevel) => {
      const params = new URLSearchParams(searchParams.toString())

      // Only add to URL if expanded (level > 0)
      if (newLevel > 0) {
        params.set(paramKey, String(newLevel))
      } else {
        params.delete(paramKey)
      }

      // Use replace to avoid adding to browser history
      const newUrl = `${window.location.pathname}?${params.toString()}`
      router.replace(newUrl, { scroll: false })
    },
    [searchParams, paramKey, router]
  )

  // Cycle to next level (wraps around)
  const nextLevel = useCallback(() => {
    const next = ((level + 1) % (MAX_DISCLOSURE_LEVEL + 1)) as DisclosureLevel
    setLevel(next)
  }, [level, setLevel])

  // Reset to collapsed state
  const reset = useCallback(() => {
    setLevel(0)
  }, [setLevel])

  // Derived state
  const isExpanded = level > 0

  return {
    level,
    nextLevel,
    setLevel,
    isExpanded,
    reset,
  }
}

/**
 * Extract level number from URL params for a specific card
 * (Server-side compatible version that doesn't use hooks)
 *
 * @param searchParams - URLSearchParams object
 * @param cardId - Unique identifier for this card
 * @param initialLevel - Default level if not in URL
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const level = getDisclosureLevelFromParams(searchParams, 'running-queries', 0)
 * ```
 */
export function getDisclosureLevelFromParams(
  searchParams: URLSearchParams | null,
  cardId: string,
  initialLevel: DisclosureLevel = 0
): DisclosureLevel {
  if (!searchParams) return initialLevel

  const paramKey = `disclosure-${cardId}`
  const levelParam = searchParams.get(paramKey)

  if (levelParam !== null) {
    const parsed = Number.parseInt(levelParam, 10)
    if (
      !Number.isNaN(parsed) &&
      parsed >= 0 &&
      parsed <= MAX_DISCLOSURE_LEVEL
    ) {
      return parsed as DisclosureLevel
    }
  }

  return initialLevel
}
