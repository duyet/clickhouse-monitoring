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
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const sanitized: ThresholdsMap = {}
    for (const [checkId, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      if (!value || typeof value !== 'object') continue
      const v = value as { warning?: unknown; critical?: unknown }
      const warning = Number(v.warning)
      const critical = Number(v.critical)
      if (Number.isFinite(warning) && Number.isFinite(critical)) {
        sanitized[checkId] = { warning, critical }
      }
    }
    return sanitized
  } catch {
    return {}
  }
}

export function saveThresholds(map: ThresholdsMap): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    window.dispatchEvent(new CustomEvent('health-thresholds-changed'))
    return true
  } catch {
    return false
  }
}

export function resetThreshold(checkId: string): boolean {
  const map = loadThresholds()
  delete map[checkId]
  return saveThresholds(map)
}

export function setThreshold(checkId: string, thresholds: Thresholds): boolean {
  const map = loadThresholds()
  map[checkId] = thresholds
  return saveThresholds(map)
}
