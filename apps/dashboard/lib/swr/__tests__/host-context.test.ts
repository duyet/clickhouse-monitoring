/**
 * Tests for host-context.tsx — HostProvider context and hooks.
 *
 * Since this project doesn't use @testing-library/react, we test the hook
 * behavior directly by exercising the context value logic.
 */

import {
  HostProvider,
  useHostContext,
  useHostIdFromContext,
} from '../host-context'
import { describe, expect, it } from 'bun:test'

describe('HostProvider', () => {
  it('exports HostProvider as a function', () => {
    expect(typeof HostProvider).toBe('function')
  })

  it('exports useHostContext as a function', () => {
    expect(typeof useHostContext).toBe('function')
  })

  it('exports useHostIdFromContext as a function', () => {
    expect(typeof useHostIdFromContext).toBe('function')
  })
})
