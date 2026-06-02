'use client'

import { useEffect, useState } from 'react'
import {
  BROWSER_CONNECTIONS_STORAGE_KEY,
  type BrowserConnection,
} from '@/lib/types/browser-connection'

function loadConnections(): BrowserConnection[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(BROWSER_CONNECTIONS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as BrowserConnection[]
    }
  } catch (error) {
    console.error('Failed to load browser connections:', error)
  }

  return []
}

function saveConnections(connections: BrowserConnection[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      BROWSER_CONNECTIONS_STORAGE_KEY,
      JSON.stringify(connections)
    )
  } catch (error) {
    console.error('Failed to save browser connections:', error)
  }
}

export function useBrowserConnections() {
  const [connections, setConnections] = useState<BrowserConnection[]>([])
  const [mounted, setMounted] = useState(false)

  // Load from localStorage after hydration
  useEffect(() => {
    setConnections(loadConnections())
    setMounted(true)
  }, [])

  const addConnection = (
    input: Omit<BrowserConnection, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>
  ): BrowserConnection => {
    const now = new Date().toISOString()
    const newConnection: BrowserConnection = {
      ...input,
      id: crypto.randomUUID(),
      hostId: 0, // temporary; replaced inside setConnections below
      createdAt: now,
      updatedAt: now,
    }

    let result = newConnection
    setConnections((prev) => {
      const existingHostIds = prev.map((c) => c.hostId)
      const hostId = Math.min(...existingHostIds, 0) - 1
      result = { ...newConnection, hostId }
      const updated = [...prev, result]
      saveConnections(updated)
      return updated
    })

    return result
  }

  const updateConnection = (
    id: string,
    updates: Partial<Omit<BrowserConnection, 'id' | 'hostId' | 'createdAt'>>
  ): void => {
    setConnections((prev) => {
      const updated = prev.map((c) =>
        c.id === id
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c
      )
      saveConnections(updated)
      return updated
    })
  }

  const deleteConnection = (id: string): void => {
    setConnections((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      saveConnections(updated)
      return updated
    })
  }

  return {
    connections,
    addConnection,
    updateConnection,
    deleteConnection,
    mounted,
  }
}
