'use client'

const STORAGE_KEY = 'health-thresholds'

export interface Thresholds {
  warning: number
  critical: number
}

export type ThresholdsMap = Record<string, Thresholds>

export function loadThresholds(): ThresholdsMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ThresholdsMap
  } catch {
    return {}
  }
}

export function saveThresholds(map: ThresholdsMap): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    window.dispatchEvent(new CustomEvent('health-thresholds-changed'))
  } catch {
    // localStorage may be full or disabled
  }
}

export function resetThreshold(checkId: string): void {
  const map = loadThresholds()
  delete map[checkId]
  saveThresholds(map)
}

export function setThreshold(checkId: string, thresholds: Thresholds): void {
  const map = loadThresholds()
  map[checkId] = thresholds
  saveThresholds(map)
}
