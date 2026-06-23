import {
  deleteDashboard,
  listDashboards,
  loadDashboard,
  saveDashboard,
} from './dashboard-storage'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

const STORAGE_KEY = 'clickhouse-monitor-dashboards'

// Minimal localStorage mock
function makeLocalStorageMock() {
  const store: Record<string, string> = {}
  return {
    getItem(key: string): string | null {
      return Object.hasOwn(store, key) ? store[key] : null
    },
    setItem(key: string, value: string): void {
      store[key] = value
    },
    removeItem(key: string): void {
      delete store[key]
    },
    clear(): void {
      for (const k of Object.keys(store)) delete store[k]
    },
    get length() {
      return Object.keys(store).length
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null
    },
  }
}

describe('dashboard-storage — SSR guard', () => {
  it('returns empty list when window is undefined', () => {
    // Bun runs in Node; window is undefined by default
    const savedWindow = globalThis.window
    // @ts-expect-error
    delete globalThis.window
    // @ts-expect-error
    delete globalThis.localStorage

    try {
      expect(listDashboards()).toEqual([])
      expect(loadDashboard('any')).toBeNull()
      // saveDashboard and deleteDashboard should be no-ops (no throw)
      expect(() => saveDashboard('x', ['a'])).not.toThrow()
      expect(() => deleteDashboard('x')).not.toThrow()
    } finally {
      globalThis.window = savedWindow
    }
  })
})

describe('dashboard-storage — with localStorage mock', () => {
  let lsMock: ReturnType<typeof makeLocalStorageMock>

  beforeEach(() => {
    lsMock = makeLocalStorageMock()
    // @ts-expect-error
    globalThis.window = globalThis
    globalThis.localStorage = lsMock
  })

  afterEach(() => {
    // @ts-expect-error
    delete globalThis.window
    // @ts-expect-error
    delete globalThis.localStorage
  })

  describe('saveDashboard / loadDashboard round-trip', () => {
    it('saves and loads a dashboard by name', () => {
      saveDashboard('myDash', ['chart1', 'chart2'])
      expect(loadDashboard('myDash')).toEqual(['chart1', 'chart2'])
    })

    it('saves an empty chart list', () => {
      saveDashboard('empty', [])
      expect(loadDashboard('empty')).toEqual([])
    })

    it('overwrites an existing dashboard with the same name', () => {
      saveDashboard('dash', ['old'])
      saveDashboard('dash', ['new1', 'new2'])
      expect(loadDashboard('dash')).toEqual(['new1', 'new2'])
    })

    it('preserves other dashboards when saving a new one', () => {
      saveDashboard('a', ['x'])
      saveDashboard('b', ['y'])
      expect(loadDashboard('a')).toEqual(['x'])
      expect(loadDashboard('b')).toEqual(['y'])
    })
  })

  describe('loadDashboard', () => {
    it('returns null for a non-existent dashboard', () => {
      expect(loadDashboard('nonexistent')).toBeNull()
    })
  })

  describe('listDashboards', () => {
    it('returns empty array when no dashboards saved', () => {
      expect(listDashboards()).toEqual([])
    })

    it('returns sorted dashboard names', () => {
      saveDashboard('zebra', [])
      saveDashboard('alpha', [])
      saveDashboard('middle', [])
      expect(listDashboards()).toEqual(['alpha', 'middle', 'zebra'])
    })

    it('reflects names after deletion', () => {
      saveDashboard('a', [])
      saveDashboard('b', [])
      deleteDashboard('a')
      expect(listDashboards()).toEqual(['b'])
    })
  })

  describe('deleteDashboard', () => {
    it('removes a dashboard by name', () => {
      saveDashboard('toDelete', ['c1'])
      deleteDashboard('toDelete')
      expect(loadDashboard('toDelete')).toBeNull()
    })

    it('is a no-op for a non-existent dashboard', () => {
      saveDashboard('keep', ['x'])
      expect(() => deleteDashboard('ghost')).not.toThrow()
      // kept dashboard unaffected
      expect(loadDashboard('keep')).toEqual(['x'])
    })

    it('does not remove other dashboards', () => {
      saveDashboard('a', ['1'])
      saveDashboard('b', ['2'])
      deleteDashboard('a')
      expect(loadDashboard('b')).toEqual(['2'])
    })
  })

  describe('malformed JSON fallback', () => {
    it('treats invalid JSON as an empty store', () => {
      lsMock.setItem(STORAGE_KEY, 'not-json{{{')
      expect(listDashboards()).toEqual([])
      expect(loadDashboard('x')).toBeNull()
    })

    it('treats a JSON array as an empty store', () => {
      lsMock.setItem(STORAGE_KEY, JSON.stringify(['a', 'b']))
      expect(listDashboards()).toEqual([])
    })

    it('treats null JSON value as an empty store', () => {
      lsMock.setItem(STORAGE_KEY, 'null')
      expect(listDashboards()).toEqual([])
    })

    it('treats a JSON primitive as an empty store', () => {
      lsMock.setItem(STORAGE_KEY, '42')
      expect(listDashboards()).toEqual([])
    })

    it('still allows saving after a malformed store', () => {
      lsMock.setItem(STORAGE_KEY, 'bad')
      saveDashboard('fresh', ['chart'])
      expect(loadDashboard('fresh')).toEqual(['chart'])
    })
  })

  describe('default / missing key', () => {
    it('returns empty list when localStorage key is absent', () => {
      expect(listDashboards()).toEqual([])
    })

    it('returns null load when localStorage key is absent', () => {
      expect(loadDashboard('anything')).toBeNull()
    })
  })
})
