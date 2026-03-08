/**
 * Dashboard Storage - localStorage persistence for saved dashboards
 *
 * Provides save/load/list/delete operations for custom dashboard configurations.
 * Data is stored under a single JSON key in localStorage.
 */

const STORAGE_KEY = 'clickhouse-monitor-dashboards'

type DashboardStore = Record<string, string[]>

function readStore(): DashboardStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {}
    }
    return parsed as DashboardStore
  } catch {
    return {}
  }
}

function writeStore(store: DashboardStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // localStorage may be full or unavailable (e.g. private browsing)
  }
}

/**
 * Save a dashboard configuration under the given name.
 * Overwrites any existing dashboard with the same name.
 */
export function saveDashboard(name: string, charts: string[]): void {
  const store = readStore()
  store[name] = charts
  writeStore(store)
}

/**
 * Load a saved dashboard by name.
 * Returns null if the dashboard does not exist.
 */
export function loadDashboard(name: string): string[] | null {
  const store = readStore()
  return store[name] ?? null
}

/**
 * List all saved dashboard names, sorted alphabetically.
 */
export function listDashboards(): string[] {
  return Object.keys(readStore()).sort()
}

/**
 * Delete a saved dashboard by name.
 */
export function deleteDashboard(name: string): void {
  const store = readStore()
  delete store[name]
  writeStore(store)
}
