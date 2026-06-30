import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  loadThresholds,
  resetThreshold,
  saveThresholds,
  setThreshold,
} from '@/lib/health/thresholds-storage'

// ── In-memory localStorage + window shim (bun has no DOM by default) ──
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(k: string) {
    return this.store.has(k) ? (this.store.get(k) as string) : null
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v))
  }
  removeItem(k: string) {
    this.store.delete(k)
  }
  clear() {
    this.store.clear()
  }
}

const events: string[] = []

beforeEach(() => {
  events.length = 0
  const storage = new MemoryStorage()
  ;(globalThis as unknown as Record<string, unknown>).localStorage = storage
  ;(globalThis as unknown as Record<string, unknown>).window = {
    ...globalThis,
    localStorage: storage,
    dispatchEvent: (e: Event) => {
      events.push(e.type)
      return true
    },
  }
})

afterEach(() => {
  ;(globalThis as unknown as Record<string, unknown>).localStorage = undefined
  ;(globalThis as unknown as Record<string, unknown>).window = undefined
})

describe('loadThresholds', () => {
  test('returns empty object when storage is empty', () => {
    expect(loadThresholds()).toEqual({})
  })

  test('round-trips a saved map', () => {
    const map = {
      'disk-percent': { warning: 80, critical: 95 },
      'failed-queries': { warning: 10, critical: 100 },
    }
    localStorage.setItem('health-thresholds', JSON.stringify(map))
    expect(loadThresholds()).toEqual(map)
  })

  test('coerces numeric strings to numbers', () => {
    localStorage.setItem(
      'health-thresholds',
      JSON.stringify({ 'disk-percent': { warning: '80', critical: '95' } })
    )
    const result = loadThresholds()
    expect(result['disk-percent']).toEqual({ warning: 80, critical: 95 })
  })

  test('drops entries whose warning/critical are not finite numbers', () => {
    // Write raw JSON to avoid JSON.stringify converting NaN/Infinity to null
    // (which would then coerce to 0 and pass Number.isFinite).
    // "NaN" as a string → Number("NaN") = NaN → not finite → dropped.
    localStorage.setItem(
      'health-thresholds',
      '{"good":{"warning":10,"critical":50},"bad":{"warning":"nope","critical":null},"stringnan":{"warning":"NaN","critical":"Infinity"}}'
    )
    const result = loadThresholds()
    expect(Object.keys(result)).toEqual(['good'])
  })

  test('drops entries whose value is not an object', () => {
    localStorage.setItem('health-thresholds', JSON.stringify({ primitive: 42 }))
    expect(loadThresholds()).toEqual({})
  })

  test('returns empty object on malformed JSON', () => {
    localStorage.setItem('health-thresholds', 'not-json{{{')
    expect(loadThresholds()).toEqual({})
  })

  test('returns empty object when stored value is not an object', () => {
    localStorage.setItem('health-thresholds', JSON.stringify([1, 2, 3]))
    expect(loadThresholds()).toEqual({})
  })

  test('returns empty object on null stored value', () => {
    localStorage.setItem('health-thresholds', JSON.stringify(null))
    expect(loadThresholds()).toEqual({})
  })
})

describe('saveThresholds', () => {
  test('persists the map and returns true', () => {
    const map = { 'disk-percent': { warning: 80, critical: 95 } }
    const result = saveThresholds(map)
    expect(result).toBe(true)
    expect(loadThresholds()).toEqual(map)
  })

  test('dispatches health-thresholds-changed event on save', () => {
    saveThresholds({ 'disk-percent': { warning: 80, critical: 95 } })
    expect(events).toContain('health-thresholds-changed')
  })

  test('dispatches exactly one event per save call', () => {
    saveThresholds({})
    expect(events).toHaveLength(1)
  })
})

describe('setThreshold', () => {
  test('adds a new entry', () => {
    const ok = setThreshold('disk-percent', { warning: 80, critical: 95 })
    expect(ok).toBe(true)
    expect(loadThresholds()['disk-percent']).toEqual({
      warning: 80,
      critical: 95,
    })
  })

  test('overwrites an existing entry', () => {
    setThreshold('disk-percent', { warning: 80, critical: 95 })
    setThreshold('disk-percent', { warning: 70, critical: 90 })
    expect(loadThresholds()['disk-percent']).toEqual({
      warning: 70,
      critical: 90,
    })
  })

  test('preserves other entries when setting one', () => {
    setThreshold('a', { warning: 1, critical: 2 })
    setThreshold('b', { warning: 3, critical: 4 })
    const map = loadThresholds()
    expect(map.a).toEqual({ warning: 1, critical: 2 })
    expect(map.b).toEqual({ warning: 3, critical: 4 })
  })

  test('dispatches changed event', () => {
    setThreshold('x', { warning: 5, critical: 10 })
    expect(events).toContain('health-thresholds-changed')
  })
})

describe('resetThreshold', () => {
  test('removes the entry and returns true', () => {
    setThreshold('disk-percent', { warning: 80, critical: 95 })
    events.length = 0

    const ok = resetThreshold('disk-percent')
    expect(ok).toBe(true)
    expect(loadThresholds()['disk-percent']).toBeUndefined()
  })

  test('does not affect other entries', () => {
    setThreshold('a', { warning: 1, critical: 2 })
    setThreshold('b', { warning: 3, critical: 4 })
    resetThreshold('a')
    const map = loadThresholds()
    expect(map.a).toBeUndefined()
    expect(map.b).toEqual({ warning: 3, critical: 4 })
  })

  test('is a no-op and returns true when key does not exist', () => {
    const ok = resetThreshold('nonexistent')
    expect(ok).toBe(true)
  })

  test('dispatches changed event on reset', () => {
    resetThreshold('any')
    expect(events).toContain('health-thresholds-changed')
  })
})

describe('SSR guard', () => {
  test('loadThresholds returns empty object when window is undefined', () => {
    const win = (globalThis as unknown as Record<string, unknown>).window
    ;(globalThis as unknown as Record<string, unknown>).window = undefined
    expect(loadThresholds()).toEqual({})
    ;(globalThis as unknown as Record<string, unknown>).window = win
  })

  test('saveThresholds returns false when window is undefined', () => {
    const win = (globalThis as unknown as Record<string, unknown>).window
    ;(globalThis as unknown as Record<string, unknown>).window = undefined
    expect(saveThresholds({ x: { warning: 1, critical: 2 } })).toBe(false)
    ;(globalThis as unknown as Record<string, unknown>).window = win
  })
})
