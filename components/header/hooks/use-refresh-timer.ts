'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Configuration options for the refresh timer hook
 */
export interface UseRefreshTimerOptions {
  /** Refresh interval in milliseconds (default: 60000) */
  interval?: number
  /** Callback fired when timer completes and refresh should occur */
  onRefresh?: () => void
  /** Whether the timer is enabled (default: true) */
  enabled?: boolean
}

/**
 * Return value of the refresh timer hook
 */
export interface UseRefreshTimerReturn {
  /** Remaining seconds until next refresh (0 when disabled) */
  remaining: number
  /** Whether the timer is currently paused */
  isPaused: boolean
  /** Pause the countdown timer */
  pause: () => void
  /** Resume the countdown timer */
  resume: () => void
  /** Reset the countdown to the initial interval */
  reset: () => void
  /** Progress value from 0-1 (useful for progress bars) */
  progress: number
}

const DEFAULT_INTERVAL = 60000 // 1 minute
const TICK_RATE = 1000 // 1 second

/**
 * Hook for managing auto-refresh countdown timer with pause/resume functionality
 *
 * @example
 * ```tsx
 * const { remaining, isPaused, pause, resume, reset, progress } = useRefreshTimer({
 *   interval: 60000,
 *   onRefresh: () => console.log('Refresh!'),
 *   enabled: true,
 * })
 * ```
 */
export function useRefreshTimer({
  interval: intervalMs = DEFAULT_INTERVAL,
  onRefresh,
  enabled = true,
}: UseRefreshTimerOptions = {}): UseRefreshTimerReturn {
  const initialSeconds = Math.floor(intervalMs / 1000)
  const [remaining, setRemaining] = useState(initialSeconds)
  const [isPaused, setIsPaused] = useState(false)

  // Track if we're currently refreshing to prevent double-triggers
  const isRefreshingRef = useRef<boolean>(false)
  // Store the animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null)

  /**
   * Reset countdown to initial value
   */
  const reset = useCallback(() => {
    setRemaining(initialSeconds)
    isRefreshingRef.current = false
  }, [initialSeconds])

  /**
   * Pause the countdown timer
   */
  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  /**
   * Resume the countdown timer
   */
  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  /**
   * Handle the refresh callback with debouncing
   */
  const triggerRefresh = useCallback(() => {
    if (isRefreshingRef.current) return

    isRefreshingRef.current = true
    onRefresh?.()

    // Reset the refreshing flag after a short delay
    setTimeout(() => {
      isRefreshingRef.current = false
    }, 1000)
  }, [onRefresh])

  // Update interval when the interval prop changes
  useEffect(() => {
    setRemaining(Math.floor(intervalMs / 1000))
  }, [intervalMs])

  // Countdown timer using requestAnimationFrame for smooth updates
  useEffect(() => {
    if (!enabled || isPaused) {
      return
    }

    let lastTime = Date.now()

    const tick = () => {
      const now = Date.now()
      const elapsed = now - lastTime

      if (elapsed >= TICK_RATE) {
        setRemaining((prev) => {
          const next = prev - 1

          // Trigger refresh when countdown reaches zero
          if (next <= 0) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
              triggerRefresh()
              setRemaining(initialSeconds)
            }, 0)
            return 0
          }

          return next
        })

        lastTime = now
      }

      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [enabled, isPaused, initialSeconds, triggerRefresh])

  // Calculate progress (0 = just started, 1 = about to refresh)
  const progress = enabled ? (initialSeconds - remaining) / initialSeconds : 0

  return {
    remaining: enabled ? remaining : 0,
    isPaused,
    pause,
    resume,
    reset,
    progress,
  }
}
