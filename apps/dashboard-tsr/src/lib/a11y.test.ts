import { describe, expect, test } from 'bun:test'
import type { KeyboardEvent } from 'react'

import { activateOnEnterOrSpace } from './a11y'

function fakeEvent(key: string) {
  let prevented = false
  return {
    event: {
      key,
      preventDefault: () => {
        prevented = true
      },
    } as unknown as KeyboardEvent,
    wasPrevented: () => prevented,
  }
}

describe('activateOnEnterOrSpace', () => {
  test('activates and preventsDefault on Enter', () => {
    let called = 0
    const handler = activateOnEnterOrSpace(() => {
      called++
    })
    const { event, wasPrevented } = fakeEvent('Enter')
    handler(event)
    expect(called).toBe(1)
    expect(wasPrevented()).toBe(true)
  })

  test('activates and preventsDefault on Space', () => {
    let called = 0
    const handler = activateOnEnterOrSpace(() => {
      called++
    })
    const { event, wasPrevented } = fakeEvent(' ')
    handler(event)
    expect(called).toBe(1)
    expect(wasPrevented()).toBe(true)
  })

  test('ignores other keys (no activation, no preventDefault)', () => {
    let called = 0
    const handler = activateOnEnterOrSpace(() => {
      called++
    })
    for (const key of ['Tab', 'a', 'ArrowDown', 'Escape']) {
      const { event, wasPrevented } = fakeEvent(key)
      handler(event)
      expect(wasPrevented()).toBe(false)
    }
    expect(called).toBe(0)
  })
})
