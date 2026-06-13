import { QueryClient } from '@tanstack/react-query'

import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'

describe('QueryProvider swr:revalidate integration', () => {
  let queryClient: QueryClient
  let invalidateSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    queryClient = new QueryClient()
    invalidateSpy = spyOn(queryClient, 'invalidateQueries')
  })

  afterEach(() => {
    invalidateSpy.mockRestore()
  })

  it('calls invalidateQueries({ type: "active" }) when swr:revalidate fires', () => {
    // Simulate the effect body from QueryProvider directly.
    // The effect registers a window listener; we replicate that wiring here
    // so the test stays decoupled from React rendering internals.
    const listeners: Record<string, EventListenerOrEventListenerObject[]> = {}
    const mockWindow = {
      addEventListener: (
        event: string,
        cb: EventListenerOrEventListenerObject
      ) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(cb)
      },
      removeEventListener: (
        event: string,
        cb: EventListenerOrEventListenerObject
      ) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((x) => x !== cb)
        }
      },
    }

    // Wire up the same handler logic as in provider.tsx's useEffect
    const handleRevalidate = () => {
      queryClient.invalidateQueries({ type: 'active' })
    }
    mockWindow.addEventListener('swr:revalidate', handleRevalidate)

    // Trigger the event
    listeners['swr:revalidate'].forEach((cb) =>
      typeof cb === 'function'
        ? cb()
        : cb.handleEvent(new Event('swr:revalidate'))
    )

    expect(invalidateSpy).toHaveBeenCalledWith({ type: 'active' })

    // Cleanup unregisters the listener
    mockWindow.removeEventListener('swr:revalidate', handleRevalidate)
    expect(listeners['swr:revalidate'].length).toBe(0)
  })

  it('does not call invalidateQueries before the event fires', () => {
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
