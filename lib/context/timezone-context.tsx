'use client'

import { createContext, useContext } from 'react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

const TimezoneContext = createContext<string>('UTC')

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useUserSettings()
  return (
    <TimezoneContext.Provider value={settings.timezone}>
      {children}
    </TimezoneContext.Provider>
  )
}

export function useTimezone(): string {
  const context = useContext(TimezoneContext)
  return context || 'UTC'
}
