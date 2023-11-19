'use client'

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'

import type { ClickHouseInterval } from '@/lib/types/clickhouse-interval'

export interface ContextValue {
  interval: ClickHouseInterval
  setInterval?: Dispatch<SetStateAction<ClickHouseInterval>>
  reloadInterval: number | null
  setReloadInterval: Dispatch<SetStateAction<number | null>>
}

export const Context = createContext<ContextValue | undefined>(undefined)

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [interval, setInterval] = useState<ClickHouseInterval>(
    'toStartOfFiveMinutes'
  )

  // Set reload interval to 5 seconds by default
  // setReloadInterval(null) to stop it
  const [reloadInterval, setReloadInterval] = useState<number | null>(5000)

  return (
    <Context.Provider
      value={{ interval, setInterval, reloadInterval, setReloadInterval }}
    >
      {children}
    </Context.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppProvider')
  }

  return context
}
