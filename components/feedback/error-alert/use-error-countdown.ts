/**
 * useErrorCountdown hook
 *
 * Manages countdown timer for auto-retry functionality in error alerts.
 */

import { useEffect, useState } from 'react'

interface UseErrorCountdownOptions {
  /** Callback to execute when countdown reaches zero */
  onCountdownComplete?: () => void
  /** Initial countdown value in seconds (default: 30) */
  initialSeconds?: number
}

/**
 * Hook that manages a countdown timer for error retry functionality
 *
 * @example
 * ```tsx
 * const { countdown, resetCountdown } = useErrorCountdown({
 *   onCountdownComplete: () => mutate(),
 *   initialSeconds: 30,
 * })
 * ```
 */
export function useErrorCountdown({
  onCountdownComplete,
  initialSeconds = 30,
}: UseErrorCountdownOptions = {}) {
  const [countdown, setCountdown] = useState(initialSeconds)

  useEffect(() => {
    if (!onCountdownComplete) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onCountdownComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onCountdownComplete])

  const resetCountdown = () => setCountdown(initialSeconds)

  return { countdown, resetCountdown }
}
