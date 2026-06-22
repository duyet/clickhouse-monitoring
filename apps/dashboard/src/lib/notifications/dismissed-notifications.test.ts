/**
 * Tests for dismissed-notifications.ts
 *
 * Mocks localStorage via globalThis to cover SSR guard, add/remove/check
 * dismissed, malformed JSON fallback, and all exported functions.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  clearDismissedNotifications,
  dismissAllNotifications,
  dismissNotification,
  filterActiveNotifications,
  getDismissedNotifications,
  getNotificationKey,
  isNotificationDismissed,
  type Notification,
} from './dismissed-notifications'

// ---------------------------------------------------------------------------
// Minimal localStorage stub
// ---------------------------------------------------------------------------

function makeLocalStorageStub() {
  const store: Record<string, string> = {}
  return {
    store,
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k]
    },
  }
}

type LocalStorageStub = ReturnType<typeof makeLocalStorageStub>

let lsStub: LocalStorageStub
const STORAGE_KEY = 'dismissed-notifications'

beforeEach(() => {
  lsStub = makeLocalStorageStub()
  Object.defineProperty(globalThis, 'localStorage', {
    value: lsStub,
    writable: true,
    configurable: true,
  })
  // Ensure window is defined so SSR guard passes
  if (typeof globalThis.window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
      value: globalThis,
      writable: true,
      configurable: true,
    })
  }
})

afterEach(() => {
  // Remove localStorage stub
  try {
    // biome-ignore lint/performance/noDelete: test cleanup
    delete (globalThis as Record<string, unknown>).localStorage
  } catch {
    // ignore
  }
})

// ---------------------------------------------------------------------------
// Sample notifications
// ---------------------------------------------------------------------------

const readonlyNotif: Notification = {
  type: 'readonly-tables',
  cluster: 'my-cluster',
  count: 5,
  severity: 'critical',
}

const healthNotif: Notification = {
  type: 'health-check',
  cluster: 'prod',
  count: 1,
  severity: 'warning',
  checkId: 'disk-usage',
}

const healthNotifWithIncident: Notification = {
  type: 'health-check',
  cluster: 'prod',
  count: 1,
  severity: 'warning',
  checkId: 'disk-usage',
  incidentId: 'inc-42',
}

// ---------------------------------------------------------------------------
// getNotificationKey
// ---------------------------------------------------------------------------

describe('getNotificationKey', () => {
  test('readonly-tables key format: type:cluster:count', () => {
    expect(getNotificationKey(readonlyNotif)).toBe(
      'readonly-tables:my-cluster:5'
    )
  })

  test('health-check without incidentId uses "current"', () => {
    expect(getNotificationKey(healthNotif)).toBe(
      'health-check:prod:disk-usage:warning:current'
    )
  })

  test('health-check with incidentId includes it', () => {
    expect(getNotificationKey(healthNotifWithIncident)).toBe(
      'health-check:prod:disk-usage:warning:inc-42'
    )
  })

  test('health-check without checkId falls back to generic format', () => {
    const n: Notification = {
      type: 'health-check',
      cluster: 'c',
      count: 3,
      severity: 'critical',
    }
    expect(getNotificationKey(n)).toBe('health-check:c:3')
  })
})

// ---------------------------------------------------------------------------
// getDismissedNotifications
// ---------------------------------------------------------------------------

describe('getDismissedNotifications', () => {
  test('returns empty set when localStorage is empty', () => {
    const result = getDismissedNotifications()
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })

  test('returns empty set when stored value is null', () => {
    // nothing set
    expect(getDismissedNotifications().size).toBe(0)
  })

  test('returns set from stored JSON array', () => {
    lsStub.store[STORAGE_KEY] = JSON.stringify(['key1', 'key2'])
    const result = getDismissedNotifications()
    expect(result.has('key1')).toBe(true)
    expect(result.has('key2')).toBe(true)
    expect(result.size).toBe(2)
  })

  test('returns empty set on malformed JSON', () => {
    lsStub.store[STORAGE_KEY] = 'not-valid-json'
    const result = getDismissedNotifications()
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })

  test('SSR guard: returns empty set when window is undefined', () => {
    const saved = (globalThis as Record<string, unknown>).window
    // biome-ignore lint/performance/noDelete: SSR simulation
    delete (globalThis as Record<string, unknown>).window
    try {
      const result = getDismissedNotifications()
      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(0)
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: saved,
        writable: true,
        configurable: true,
      })
    }
  })
})

// ---------------------------------------------------------------------------
// isNotificationDismissed
// ---------------------------------------------------------------------------

describe('isNotificationDismissed', () => {
  test('returns false for notification that has not been dismissed', () => {
    expect(isNotificationDismissed(readonlyNotif)).toBe(false)
  })

  test('returns true after notification is dismissed', () => {
    dismissNotification(readonlyNotif)
    expect(isNotificationDismissed(readonlyNotif)).toBe(true)
  })

  test('different notification keys are independent', () => {
    dismissNotification(readonlyNotif)
    expect(isNotificationDismissed(healthNotif)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// dismissNotification
// ---------------------------------------------------------------------------

describe('dismissNotification', () => {
  test('persists dismissed key to localStorage', () => {
    dismissNotification(readonlyNotif)
    const stored = JSON.parse(lsStub.store[STORAGE_KEY] ?? '[]') as string[]
    expect(stored).toContain(getNotificationKey(readonlyNotif))
  })

  test('accumulates multiple dismissed notifications', () => {
    dismissNotification(readonlyNotif)
    dismissNotification(healthNotif)
    const stored = JSON.parse(lsStub.store[STORAGE_KEY] ?? '[]') as string[]
    expect(stored).toContain(getNotificationKey(readonlyNotif))
    expect(stored).toContain(getNotificationKey(healthNotif))
  })

  test('dismissing same notification twice does not duplicate keys', () => {
    dismissNotification(readonlyNotif)
    dismissNotification(readonlyNotif)
    const stored = JSON.parse(lsStub.store[STORAGE_KEY] ?? '[]') as string[]
    const key = getNotificationKey(readonlyNotif)
    expect(stored.filter((k) => k === key).length).toBe(1)
  })

  test('SSR guard: no-op when window is undefined', () => {
    const saved = (globalThis as Record<string, unknown>).window
    // biome-ignore lint/performance/noDelete: SSR simulation
    delete (globalThis as Record<string, unknown>).window
    try {
      dismissNotification(readonlyNotif)
      expect(lsStub.store[STORAGE_KEY]).toBeUndefined()
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: saved,
        writable: true,
        configurable: true,
      })
    }
  })

  test('silently fails when localStorage.setItem throws', () => {
    const originalSetItem = lsStub.setItem.bind(lsStub)
    lsStub.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    // Should not throw
    expect(() => dismissNotification(readonlyNotif)).not.toThrow()
    // Restore
    lsStub.setItem = originalSetItem
  })
})

// ---------------------------------------------------------------------------
// dismissAllNotifications
// ---------------------------------------------------------------------------

describe('dismissAllNotifications', () => {
  test('dismisses all notifications in the list', () => {
    dismissAllNotifications([readonlyNotif, healthNotif])
    expect(isNotificationDismissed(readonlyNotif)).toBe(true)
    expect(isNotificationDismissed(healthNotif)).toBe(true)
  })

  test('no-op for empty array', () => {
    dismissAllNotifications([])
    expect(lsStub.store[STORAGE_KEY]).toBeDefined()
    const stored = JSON.parse(lsStub.store[STORAGE_KEY] ?? '[]') as string[]
    expect(stored.length).toBe(0)
  })

  test('SSR guard: no-op when window is undefined', () => {
    const saved = (globalThis as Record<string, unknown>).window
    // biome-ignore lint/performance/noDelete: SSR simulation
    delete (globalThis as Record<string, unknown>).window
    try {
      dismissAllNotifications([readonlyNotif])
      expect(lsStub.store[STORAGE_KEY]).toBeUndefined()
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: saved,
        writable: true,
        configurable: true,
      })
    }
  })

  test('preserves previously dismissed notifications', () => {
    dismissNotification(readonlyNotif)
    dismissAllNotifications([healthNotif])
    expect(isNotificationDismissed(readonlyNotif)).toBe(true)
    expect(isNotificationDismissed(healthNotif)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// clearDismissedNotifications
// ---------------------------------------------------------------------------

describe('clearDismissedNotifications', () => {
  test('removes all dismissed notifications from localStorage', () => {
    dismissNotification(readonlyNotif)
    dismissNotification(healthNotif)
    clearDismissedNotifications()
    expect(lsStub.store[STORAGE_KEY]).toBeUndefined()
  })

  test('after clear, previously dismissed notification is no longer dismissed', () => {
    dismissNotification(readonlyNotif)
    clearDismissedNotifications()
    expect(isNotificationDismissed(readonlyNotif)).toBe(false)
  })

  test('SSR guard: no-op when window is undefined', () => {
    lsStub.store[STORAGE_KEY] = JSON.stringify(['some-key'])
    const saved = (globalThis as Record<string, unknown>).window
    // biome-ignore lint/performance/noDelete: SSR simulation
    delete (globalThis as Record<string, unknown>).window
    try {
      clearDismissedNotifications()
      // Store should not have been touched
      expect(lsStub.store[STORAGE_KEY]).toBe(JSON.stringify(['some-key']))
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: saved,
        writable: true,
        configurable: true,
      })
    }
  })
})

// ---------------------------------------------------------------------------
// filterActiveNotifications
// ---------------------------------------------------------------------------

describe('filterActiveNotifications', () => {
  test('returns all notifications when none are dismissed', () => {
    const result = filterActiveNotifications([readonlyNotif, healthNotif])
    expect(result.length).toBe(2)
  })

  test('filters out dismissed notifications', () => {
    dismissNotification(readonlyNotif)
    const result = filterActiveNotifications([readonlyNotif, healthNotif])
    expect(result.length).toBe(1)
    expect(result[0]).toEqual(healthNotif)
  })

  test('returns empty array when all are dismissed', () => {
    dismissAllNotifications([readonlyNotif, healthNotif])
    const result = filterActiveNotifications([readonlyNotif, healthNotif])
    expect(result.length).toBe(0)
  })

  test('preserves notification shape including optional fields', () => {
    const notifWithLabel: Notification = {
      ...healthNotifWithIncident,
      label: 'Disk usage high',
    }
    const result = filterActiveNotifications([notifWithLabel])
    expect(result[0]).toEqual(notifWithLabel)
  })

  test('returns empty array for empty input', () => {
    const result = filterActiveNotifications([])
    expect(result.length).toBe(0)
  })

  test('correctly handles incidentId distinction — different incidents are independent', () => {
    dismissNotification(healthNotifWithIncident)
    // healthNotif has same checkId but no incidentId → different key
    const result = filterActiveNotifications([
      healthNotif,
      healthNotifWithIncident,
    ])
    expect(result.length).toBe(1)
    expect(result[0]).toEqual(healthNotif)
  })
})
