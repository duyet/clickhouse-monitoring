import type { ClickHouseInterval } from '@chm/types/clickhouse-interval'

import {
  createContext,
  type Dispatch,
  type SetStateAction,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getDeployTarget,
  installTelemetryEventSink,
  maybePingInstance,
  track,
} from '@/lib/telemetry'

export interface ContextValue {
  interval: ClickHouseInterval
  setInterval?: Dispatch<SetStateAction<ClickHouseInterval>>
  reloadInterval: number | null
  setReloadInterval: Dispatch<SetStateAction<number | null>>
}

export const Context = createContext<ContextValue | undefined>(undefined)

/** localStorage key for the persisted auto-refresh interval (ms, or 'off'). */
const RELOAD_INTERVAL_STORAGE_KEY = 'chm-refresh-interval'

/**
 * Read the initial reload interval from localStorage, falling back to the
 * provider default. Wrapped in try/catch for SSR and private-browsing safety.
 * A stored value of `'off'` means auto-refresh is disabled (`null`).
 */
function readInitialReloadInterval(defaultMs: number): number | null {
  if (typeof window === 'undefined') return defaultMs
  try {
    const stored = localStorage.getItem(RELOAD_INTERVAL_STORAGE_KEY)
    if (stored === null) return defaultMs
    if (stored === 'off') return null
    const parsed = Number(stored)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultMs
  } catch {
    return defaultMs
  }
}

/** Persist the selected reload interval to localStorage. */
function persistReloadInterval(value: number | null): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      RELOAD_INTERVAL_STORAGE_KEY,
      value === null ? 'off' : String(value)
    )
  } catch {
    // localStorage may be full or unavailable (e.g. private browsing)
  }
}

export const AppProvider = ({
  children,
  reloadIntervalSecond = 30,
}: {
  children: React.ReactNode
  reloadIntervalSecond?: number
}) => {
  const [interval, setInterval] = useState<ClickHouseInterval>(
    'toStartOfFiveMinutes'
  )

  // Reload interval defaults to the provider prop but is restored from and
  // persisted to localStorage so the user's choice survives reloads.
  // setReloadInterval(null) to stop it.
  const defaultReloadInterval = reloadIntervalSecond * 1000
  const [reloadInterval, setReloadIntervalState] = useState<number | null>(() =>
    readInitialReloadInterval(defaultReloadInterval)
  )

  const setReloadInterval: Dispatch<SetStateAction<number | null>> =
    useCallback((action) => {
      setReloadIntervalState((prev) => {
        const next =
          typeof action === 'function'
            ? (action as (p: number | null) => number | null)(prev)
            : action
        persistReloadInterval(next)
        return next
      })
    }, [])

  // Fire-and-forget product telemetry — no-op unless enabled. Once per app load.
  useEffect(() => {
    // Install the event transport before the first track() so app_loaded is
    // delivered. No-op unless telemetry is enabled and an endpoint resolves.
    installTelemetryEventSink()
    track('app_loaded', { deploy_target: getDeployTarget() })
    // Daily anonymous instance ping — no-op when telemetry is disabled or the
    // endpoint is empty.
    maybePingInstance()
  }, [])

  const value = useMemo<ContextValue>(
    () => ({
      interval,
      setInterval,
      reloadInterval,
      setReloadInterval,
    }),
    [interval, reloadInterval, setReloadInterval]
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useAppContext = () => {
  const context = use(Context)

  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppProvider')
  }

  return context
}
