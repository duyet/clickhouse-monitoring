import { QueryClient } from '@tanstack/react-query'

import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as React from 'react'

// Set up spy on prototype first
const invalidateSpy = spyOn(QueryClient.prototype, 'invalidateQueries')

import { QueryProvider } from '../provider'
import { renderToStaticMarkup } from 'react-dom/server'

describe('QueryProvider EventListener', () => {
  let originalWindow: any

  beforeEach(() => {
    originalWindow = global.window
    invalidateSpy.mockClear()
  })

  afterEach(() => {
    global.window = originalWindow
  })

  it('registers swr:revalidate event listener and handles invalidation', () => {
    const listeners: Record<string, Function[]> = {}

    // Set up mock window object
    global.window = {
      addEventListener: (event: string, cb: Function) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(cb)
      },
      removeEventListener: (event: string, cb: Function) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((x) => x !== cb)
        }
      },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    } as any

    // Mock/Spy on React.useEffect to execute effect callbacks synchronously
    const effects: Function[] = []
    const useEffectSpy = spyOn(React, 'useEffect').mockImplementation(
      (effect) => {
        effects.push(effect)
      }
    )

    // Render QueryProvider. This will trigger useState/useEffect calls
    renderToStaticMarkup(
      <QueryProvider>
        <div>Test Child</div>
      </QueryProvider>
    )

    // Verify useEffect was called
    expect(useEffectSpy).toHaveBeenCalled()

    // Execute the registered effects.
    // The second effect is the event listener effect.
    // Let's run all of them.
    const cleanups = effects
      .map((effect) => effect())
      .filter((cleanup) => typeof cleanup === 'function')

    // Verify it added the event listener for 'swr:revalidate'
    expect(listeners['swr:revalidate']).toBeDefined()
    expect(listeners['swr:revalidate'].length).toBe(1)

    // Trigger the revalidate listener
    const revalidateHandler = listeners['swr:revalidate'][0]
    revalidateHandler()

    // Verify that invalidateQueries was called on the QueryClient prototype
    expect(invalidateSpy).toHaveBeenCalledWith({ type: 'active' })

    // Clean up/unmount simulation
    cleanups.forEach((cleanup) => cleanup())

    // Verify removeEventListener was called
    expect(listeners['swr:revalidate'].length).toBe(0)

    // Restore spies
    useEffectSpy.mockRestore()
  })
})
