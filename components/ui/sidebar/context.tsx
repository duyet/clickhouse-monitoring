/**
 * Sidebar React Context
 */

'use client'

import * as React from 'react'
import type { SidebarContextValue } from './types'

export const SidebarContext = React.createContext<SidebarContextValue | null>(null)

/**
 * Hook to access sidebar context
 * @throws Error if used outside SidebarProvider
 */
export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
