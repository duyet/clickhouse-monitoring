import {
  deleteDashboard,
  listDashboards,
  loadDashboard,
  saveDashboard,
} from '../dashboard-storage'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

// Minimal in-memory localStorage stub so the SSR guard
// (`typeof window === 'undefined'`) sees a window and the read/write
// paths actually execute. Bun's test runtime has no window by default.
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? (this.store.get(key) as string) : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
}

beforeEach(() => {
  // @ts-expect-error — define window for the SSR guard in dashboard-storage
  globalThis.window = {}
  // @ts-expect-error — define localStorage backing
  globalThis.localStorage = new MemoryStorage()
})

afterEach(() => {
  // @ts-expect-error — clean up
  delete globalThis.window
  // @ts-expect-error — clean up
  delete globalThis.localStorage
})

describe('dashboard-storage', () => {
  it('returns null and empty list when nothing is saved', () => {
    expect(loadDashboard('missing')).toBeNull()
    expect(listDashboards()).toEqual([])
  })

  it('saves and reloads a dashboard by name', () => {
    saveDashboard('Mine', ['cpu', 'memory'])

    expect(loadDashboard('Mine')).toEqual(['cpu', 'memory'])
  })

  it('overwrites an existing dashboard with the same name', () => {
    saveDashboard('Mine', ['cpu'])
    saveDashboard('Mine', ['memory', 'disk'])

    expect(loadDashboard('Mine')).toEqual(['memory', 'disk'])
  })

  it('lists every saved dashboard name', () => {
    saveDashboard('A', ['cpu'])
    saveDashboard('B', ['mem'])

    const names = listDashboards().sort()
    expect(names).toEqual(['A', 'B'])
  })

  it('deletes a dashboard by name', () => {
    saveDashboard('A', ['cpu'])
    saveDashboard('B', ['mem'])

    deleteDashboard('A')

    expect(loadDashboard('A')).toBeNull()
    expect(listDashboards()).toEqual(['B'])
  })

  it('treats malformed JSON in storage as empty', () => {
    localStorage.setItem('clickhouse-monitor-dashboards', '{not json')

    expect(listDashboards()).toEqual([])
    expect(loadDashboard('any')).toBeNull()
  })

  it('rejects non-object stored payloads (arrays, scalars)', () => {
    localStorage.setItem('clickhouse-monitor-dashboards', '[1,2,3]')
    expect(listDashboards()).toEqual([])

    localStorage.setItem('clickhouse-monitor-dashboards', '"a-string"')
    expect(listDashboards()).toEqual([])
  })
})
