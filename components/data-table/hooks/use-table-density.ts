'use client'

import { useCallback, useEffect, useState } from 'react'

export type TableDensity = 'comfortable' | 'compact' | 'dense'

const STORAGE_KEY = 'data-table-density'

const DENSITY_CLASSES: Record<TableDensity, string> = {
  comfortable: 'py-3 px-4',
  compact: 'py-1 px-2 text-xs',
  dense: 'py-0.5 px-1 text-xs',
}

function readStoredDensity(): TableDensity {
  if (typeof window === 'undefined') return 'comfortable'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (
      stored === 'comfortable' ||
      stored === 'compact' ||
      stored === 'dense'
    ) {
      return stored
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'comfortable'
}

export function useTableDensity(override?: TableDensity) {
  const [density, setDensityState] = useState<TableDensity>('comfortable')

  // Hydrate from localStorage on mount
  useEffect(() => {
    setDensityState(readStoredDensity())
  }, [])

  const setDensity = useCallback((next: TableDensity) => {
    setDensityState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const effectiveDensity = override ?? density

  return {
    density: effectiveDensity,
    setDensity,
    cellClassName: DENSITY_CLASSES[effectiveDensity],
  }
}
