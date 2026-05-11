/**
 * Global SWR mock preload
 *
 * Workaround for Bun 1.3 module resolution bug:
 * SWR's 3-level re-export chain (index.mjs -> _internal/index.mjs -> config-context-*.mjs)
 * fails with "Export named 'mutate' not found" when many test files run together.
 *
 * This preload mocks SWR BEFORE any test file loads, preventing the broken re-export chain
 * from being resolved. The mock function is exposed via globalThis.__swrUseSWR so per-file
 * tests can control it (mockReturnValue, mockReset, mockImplementation, etc.).
 */
import { mock } from 'bun:test'

// Shared mock function that tests can control via globalThis.__swrUseSWR
const swrUseSWR = mock(
  (_key?: unknown, _fetcher?: unknown, _options?: unknown) => ({
    data: undefined,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: () => Promise.resolve(),
  })
)

// Expose for per-file test access
globalThis.__swrUseSWR = swrUseSWR as (typeof globalThis)['__swrUseSWR']

mock.module('swr', () => ({
  default: swrUseSWR,
  mutate: mock(() => Promise.resolve()),
  preload: mock(() => Promise.resolve()),
  SWRConfig: ({ children }: { children?: React.ReactNode }) => children,
  useSWRConfig: mock(() => ({ mutate: () => Promise.resolve() })),
  unstable_serialize: (key: unknown) => JSON.stringify(key),
  useSWR: swrUseSWR,
  useSWRInfinite: mock(() => ({
    data: undefined,
    error: undefined,
    isLoading: false,
    isValidating: false,
    size: 0,
    setSize: () => {},
    mutate: () => Promise.resolve(),
  })),
  __esModule: true,
}))
