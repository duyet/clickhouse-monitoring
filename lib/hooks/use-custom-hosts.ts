'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CUSTOM_HOSTS_STORAGE_KEY,
  type CustomHost,
  type CustomHostInput,
} from '@/lib/types/custom-hosts'

function loadHosts(): CustomHost[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(CUSTOM_HOSTS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as CustomHost[]
    }
  } catch (error) {
    console.error('Failed to load custom hosts:', error)
  }

  return []
}

function saveHosts(hosts: CustomHost[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CUSTOM_HOSTS_STORAGE_KEY, JSON.stringify(hosts))
  } catch (error) {
    console.error('Failed to save custom hosts:', error)
  }
}

export function useCustomHosts() {
  const [hosts, setHosts] = useState<CustomHost[]>([])
  const [mounted, setMounted] = useState(false)

  // Load from localStorage after hydration
  useEffect(() => {
    setHosts(loadHosts())
    setMounted(true)
  }, [])

  const addHost = useCallback(
    (input: CustomHostInput): CustomHost => {
      const now = new Date().toISOString()
      const newHost: CustomHost = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }
      const updated = [...hosts, newHost]
      setHosts(updated)
      saveHosts(updated)
      return newHost
    },
    [hosts]
  )

  const updateHost = useCallback(
    (id: string, updates: Partial<CustomHostInput>): void => {
      const updated = hosts.map((h) =>
        h.id === id
          ? { ...h, ...updates, updatedAt: new Date().toISOString() }
          : h
      )
      setHosts(updated)
      saveHosts(updated)
    },
    [hosts]
  )

  const removeHost = useCallback(
    (id: string): void => {
      const updated = hosts.filter((h) => h.id !== id)
      setHosts(updated)
      saveHosts(updated)
    },
    [hosts]
  )

  return { hosts, addHost, updateHost, removeHost, mounted }
}
