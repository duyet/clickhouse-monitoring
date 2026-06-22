import { describe, expect, test, beforeEach, afterEach } from 'bun:test'

// We import the module fresh per test by re-requiring it.
// Because the module caches `registered` at module level, we need to
// manipulate globalThis.window to control SSR-guard behaviour.

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a minimal Error that matches what browsers throw for dynamic import failures. */
function makeImportError(message: string): Error {
  return Object.assign(new Error(message), {})
}

/** Minimal sessionStorage double */
function makeSessionStorage(initial: Record<string, string> = {}): Storage {
  const store: Record<string, string> = { ...initial }
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k]
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length
    },
  } as unknown as Storage
}

// ─────────────────────────────────────────────────────────────────────────────
// isDynamicImportError — isolated predicate tests (no DOM needed)
// We test the predicate indirectly through the unhandledrejection listener,
// but it is simpler to test the exact strings via the exported behaviour.
// Since the function is unexported, we verify it through observable side-effects
// (does reloadOnce get called?) by setting up minimal window stubs.
// ─────────────────────────────────────────────────────────────────────────────

describe('isDynamicImportError predicate (via unhandledrejection)', () => {
  // We re-register fresh each test by resetting `registered` via a fresh window.
  // Trick: reassign globalThis.window so the module-level `registered` flag is
  // reset by reimporting. In Bun tests we achieve this by not reimporting the
  // module — instead we only check the observable effect (reload vs no-reload).

  const RELOAD_TS_KEY = 'chm:stale-chunk-reload-ts'

  let reloadCalled: boolean
  let listeners: Record<string, ((e: Event) => void)[]>
  let ss: Storage

  function setup() {
    reloadCalled = false
    listeners = {}
    ss = makeSessionStorage()

    const mockWindow = {
      addEventListener: (type: string, handler: (e: Event) => void) => {
        listeners[type] = listeners[type] ?? []
        listeners[type].push(handler)
      },
      location: {
        reload: () => {
          reloadCalled = true
        },
      },
    }

    // Patch globalThis so the module sees window + sessionStorage + location
    Object.assign(globalThis, {
      window: mockWindow,
      sessionStorage: ss,
      location: mockWindow.location,
    })
  }

  function fireUnhandledRejection(reason: unknown) {
    const evt = Object.assign(new Event('unhandledrejection'), {
      reason,
      preventDefault() {},
    })
    for (const handler of listeners['unhandledrejection'] ?? []) {
      handler(evt)
    }
  }

  // After each test we need to reset the `registered` flag inside the module.
  // The easiest way in Bun is to delete the module from the require cache —
  // Bun does not expose require.cache directly for ESM, so we work around it
  // by running each test in a separate import() with a cache-busting parameter.
  // Instead, we just reset `window` to undefined so the re-import guard fires.
  afterEach(() => {
    // Remove window so next setup() starts clean
    ;(globalThis as unknown as Record<string, unknown>)['window'] = undefined
  })

  test('Error with "Failed to fetch dynamically imported module" triggers reload', async () => {
    setup()
    // Fresh import with cache-bust so `registered` is false
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-1`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(
      makeImportError(
        'Failed to fetch dynamically imported module: /assets/foo-abc123.js'
      )
    )
    expect(reloadCalled).toBe(true)
  })

  test('Error with "error loading dynamically imported module" triggers reload', async () => {
    setup()
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-2`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(
      makeImportError('error loading dynamically imported module')
    )
    expect(reloadCalled).toBe(true)
  })

  test('Error with "Importing a module script failed" triggers reload', async () => {
    setup()
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-3`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(makeImportError('Importing a module script failed'))
    expect(reloadCalled).toBe(true)
  })

  test('string reason matching "Failed to fetch dynamically imported module" triggers reload', async () => {
    setup()
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-4`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(
      'Failed to fetch dynamically imported module: /assets/chunk.js'
    )
    expect(reloadCalled).toBe(true)
  })

  test('unrelated Error does NOT trigger reload', async () => {
    setup()
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-5`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(new Error('Network request failed'))
    expect(reloadCalled).toBe(false)
  })

  test('null reason does NOT trigger reload', async () => {
    setup()
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-6`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(null)
    expect(reloadCalled).toBe(false)
  })

  test('object reason does NOT trigger reload', async () => {
    setup()
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-7`
    )
    registerStaleChunkReload()

    fireUnhandledRejection({ code: 404 })
    expect(reloadCalled).toBe(false)
  })

  test('message check is case-insensitive', async () => {
    setup()
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-8`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(
      makeImportError('FAILED TO FETCH DYNAMICALLY IMPORTED MODULE: /x.js')
    )
    expect(reloadCalled).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Reload-loop guard (sessionStorage timestamp)
// ─────────────────────────────────────────────────────────────────────────────

describe('reload-loop guard', () => {
  const RELOAD_TS_KEY = 'chm:stale-chunk-reload-ts'
  const RELOAD_WINDOW_MS = 10_000

  let reloadCalled: boolean
  let listeners: Record<string, ((e: Event) => void)[]>
  let ss: Storage

  function setup(initial: Record<string, string> = {}) {
    reloadCalled = false
    listeners = {}
    ss = makeSessionStorage(initial)

    const mockWindow = {
      addEventListener: (type: string, handler: (e: Event) => void) => {
        listeners[type] = listeners[type] ?? []
        listeners[type].push(handler)
      },
      location: {
        reload: () => {
          reloadCalled = true
        },
      },
    }

    Object.assign(globalThis, {
      window: mockWindow,
      sessionStorage: ss,
      location: mockWindow.location,
    })
  }

  afterEach(() => {
    ;(globalThis as unknown as Record<string, unknown>)['window'] = undefined
  })

  function fireUnhandledRejection(reason: unknown) {
    const evt = Object.assign(new Event('unhandledrejection'), {
      reason,
      preventDefault() {},
    })
    for (const handler of listeners['unhandledrejection'] ?? []) {
      handler(evt)
    }
  }

  test('first stale-chunk error reloads and records timestamp', async () => {
    setup()
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-g1`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(
      makeImportError('Failed to fetch dynamically imported module: /a.js')
    )
    expect(reloadCalled).toBe(true)
    // sessionStorage must have been written
    expect(ss.getItem(RELOAD_TS_KEY)).not.toBeNull()
  })

  test('second stale-chunk error within 10s window does NOT reload', async () => {
    // Pre-seed sessionStorage with a "just reloaded" timestamp
    const recentTs = String(Date.now() - 1_000) // 1 second ago — inside 10s window
    setup({ [RELOAD_TS_KEY]: recentTs })

    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-g2`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(
      makeImportError('Failed to fetch dynamically imported module: /b.js')
    )
    expect(reloadCalled).toBe(false)
  })

  test('stale-chunk error after 10s window DOES reload again', async () => {
    // Seed with an "old" timestamp outside the 10s window
    const oldTs = String(Date.now() - RELOAD_WINDOW_MS - 1_000)
    setup({ [RELOAD_TS_KEY]: oldTs })

    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-g3`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(
      makeImportError('Failed to fetch dynamically imported module: /c.js')
    )
    expect(reloadCalled).toBe(true)
  })

  test('sessionStorage unavailable — reloads anyway (no throw)', async () => {
    setup()
    // Override sessionStorage with a throwing implementation
    Object.assign(globalThis, {
      sessionStorage: {
        getItem: () => {
          throw new Error('SecurityError: Access denied')
        },
        setItem: () => {
          throw new Error('SecurityError: Access denied')
        },
      } as unknown as Storage,
    })

    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-g4`
    )
    registerStaleChunkReload()

    fireUnhandledRejection(
      makeImportError('Failed to fetch dynamically imported module: /d.js')
    )
    expect(reloadCalled).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// vite:preloadError listener
// ─────────────────────────────────────────────────────────────────────────────

describe('vite:preloadError listener', () => {
  let reloadCalled: boolean
  let listeners: Record<string, ((e: Event) => void)[]>
  let ss: Storage

  function setup(initial: Record<string, string> = {}) {
    reloadCalled = false
    listeners = {}
    ss = makeSessionStorage(initial)

    const mockWindow = {
      addEventListener: (type: string, handler: (e: Event) => void) => {
        listeners[type] = listeners[type] ?? []
        listeners[type].push(handler)
      },
      location: {
        reload: () => {
          reloadCalled = true
        },
      },
    }

    Object.assign(globalThis, {
      window: mockWindow,
      sessionStorage: ss,
      location: mockWindow.location,
    })
  }

  afterEach(() => {
    ;(globalThis as unknown as Record<string, unknown>)['window'] = undefined
  })

  function fireVitePreloadError() {
    let defaultPrevented = false
    const evt = Object.assign(new Event('vite:preloadError'), {
      preventDefault() {
        defaultPrevented = true
      },
    })
    for (const handler of listeners['vite:preloadError'] ?? []) {
      handler(evt)
    }
    return { defaultPrevented }
  }

  test('vite:preloadError triggers reload', async () => {
    setup()
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-v1`
    )
    registerStaleChunkReload()

    fireVitePreloadError()
    expect(reloadCalled).toBe(true)
  })

  test('vite:preloadError within 10s window does NOT reload', async () => {
    const RELOAD_TS_KEY = 'chm:stale-chunk-reload-ts'
    const recentTs = String(Date.now() - 500)
    setup({ [RELOAD_TS_KEY]: recentTs })

    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-v2`
    )
    registerStaleChunkReload()

    fireVitePreloadError()
    expect(reloadCalled).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SSR / no-window guard
// ─────────────────────────────────────────────────────────────────────────────

describe('SSR guard — no window', () => {
  afterEach(() => {
    ;(globalThis as unknown as Record<string, unknown>)['window'] = undefined
  })

  test('registerStaleChunkReload is a no-op when window is undefined', async () => {
    // Ensure window is not set
    ;(globalThis as unknown as Record<string, unknown>)['window'] = undefined

    // Should not throw
    const { registerStaleChunkReload } = await import(
      `./stale-chunk-reload?t=${Date.now()}-ssr`
    )
    expect(() => registerStaleChunkReload()).not.toThrow()
  })
})
