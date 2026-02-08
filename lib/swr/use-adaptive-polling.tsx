'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

/**
 * Adaptive polling configuration
 */
interface AdaptivePollingConfig {
  /** Multiplier for refresh interval when tab is hidden (default: 4x slower) */
  hiddenMultiplier?: number
  /** Enable/disable adaptive polling (default: true) */
  enabled?: boolean
}

/**
 * Adaptive polling state
 */
interface AdaptivePollingState {
  /** Whether polling is paused by user */
  isPaused: boolean
  /** Current multiplier for refresh intervals (1x when active, higher when hidden) */
  multiplier: number
  /** Whether the document is currently hidden */
  isHidden: boolean
  /** Pause polling manually */
  pause: () => void
  /** Resume polling */
  resume: () => void
  /** Toggle pause state */
  toggle: () => void
}

const AdaptivePollingContext = createContext<AdaptivePollingState | null>(null)

interface AdaptivePollingProviderProps {
  children: ReactNode
  config?: AdaptivePollingConfig
}

/**
 * Calculate adaptive refresh interval based on current state
 * Returns 0 if paused, otherwise applies multiplier to base interval
 */
export function getAdaptiveInterval(
  baseInterval: number,
  multiplier: number,
  isPaused: boolean
): number {
  if (isPaused || baseInterval === 0) return 0
  return baseInterval * multiplier
}

/**
 * Provider component that manages adaptive polling state
 * Automatically adjusts polling rate based on document visibility
 *
 * @example
 * ```tsx
 * <SWRProvider>
 *   <AdaptivePollingProvider hiddenMultiplier={4}>
 *     <App />
 *   </AdaptivePollingProvider>
 * </SWRProvider>
 * ```
 */
export function AdaptivePollingProvider({
  children,
  config: { hiddenMultiplier = 4, enabled = true } = {},
}: AdaptivePollingProviderProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [multiplier, setMultiplier] = useState(1)

  // Handle visibility change
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      const hidden = document.hidden
      setIsHidden(hidden)
      setMultiplier(hidden ? hiddenMultiplier : 1)
    }

    // Set initial state
    handleVisibilityChange()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [hiddenMultiplier, enabled])

  const pause = useCallback(() => setIsPaused(true), [])
  const resume = useCallback(() => setIsPaused(false), [])
  const toggle = useCallback(() => setIsPaused((prev) => !prev), [])

  const value: AdaptivePollingState = {
    isPaused,
    multiplier,
    isHidden,
    pause,
    resume,
    toggle,
  }

  return (
    <AdaptivePollingContext.Provider value={value}>
      {children}
    </AdaptivePollingContext.Provider>
  )
}

/**
 * Hook to access adaptive polling state
 * Throws error if used outside AdaptivePollingProvider
 *
 * @example
 * ```tsx
 * const { isPaused, multiplier, isHidden, pause, resume } = useAdaptivePolling()
 * const adaptiveInterval = baseInterval * (isPaused ? 0 : multiplier)
 * ```
 */
export function useAdaptivePolling(): AdaptivePollingState {
  const context = useContext(AdaptivePollingContext)
  if (!context) {
    throw new Error(
      'useAdaptivePolling must be used within AdaptivePollingProvider'
    )
  }
  return context
}

/**
 * Hook to get an adaptive refresh interval
 * Automatically applies multiplier and pause state to base interval
 *
 * @example
 * ```tsx
 * const refreshInterval = useAdaptiveInterval(REFRESH_INTERVAL.DEFAULT_60S)
 * // Returns 60000 when active, 240000 when hidden, 0 when paused
 * ```
 */
export function useAdaptiveInterval(baseInterval: number): number {
  const { isPaused, multiplier } = useAdaptivePolling()
  return getAdaptiveInterval(baseInterval, multiplier, isPaused)
}
