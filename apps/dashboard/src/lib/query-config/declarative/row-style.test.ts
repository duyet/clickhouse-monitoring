/**
 * Unit tests for the rowStyle compiler (compileRowStyle).
 *
 * These pin the exact semantics of every operator and the coercion rules,
 * since rowStyle is a public contract compiled into a runtime function.
 */

import { compileRowStyle, type RowStyle } from './row-style'
import { describe, expect, test } from 'bun:test'

const RED = 'bg-red-50'
const AMBER = 'bg-amber-50'

function fn(rowStyle: RowStyle) {
  return compileRowStyle(rowStyle)
}

describe('compileRowStyle — numeric comparisons', () => {
  test('gt: strictly greater than', () => {
    const f = fn({
      rules: [{ when: { column: 'd', op: 'gt', value: 10 }, className: RED }],
    })
    expect(f({ d: 11 })).toBe(RED)
    expect(f({ d: 10 })).toBeUndefined() // not strict-greater
    expect(f({ d: 9 })).toBeUndefined()
  })

  test('gte / lt / lte boundaries', () => {
    expect(
      fn({
        rules: [
          { when: { column: 'd', op: 'gte', value: 10 }, className: RED },
        ],
      })({ d: 10 })
    ).toBe(RED)
    expect(
      fn({
        rules: [{ when: { column: 'd', op: 'lt', value: 10 }, className: RED }],
      })({ d: 10 })
    ).toBeUndefined()
    expect(
      fn({
        rules: [
          { when: { column: 'd', op: 'lte', value: 10 }, className: RED },
        ],
      })({ d: 10 })
    ).toBe(RED)
  })

  test('coerces via Number(value || 0): missing/null/string', () => {
    const f = fn({
      rules: [{ when: { column: 'd', op: 'gt', value: 0 }, className: RED }],
    })
    expect(f({})).toBeUndefined() // Number(undefined||0)=0, not >0
    expect(f({ d: null })).toBeUndefined()
    expect(f({ d: '5' })).toBe(RED) // numeric string coerces
  })
})

describe('compileRowStyle — truthiness & emptiness', () => {
  test('truthy / falsy use numeric truthiness (Number(v||0) !== 0)', () => {
    const truthy = fn({
      rules: [{ when: { column: 'e', op: 'truthy' }, className: RED }],
    })
    expect(truthy({ e: 1 })).toBe(RED)
    expect(truthy({ e: 0 })).toBeUndefined()
    expect(truthy({ e: undefined })).toBeUndefined()

    const falsy = fn({
      rules: [{ when: { column: 'e', op: 'falsy' }, className: RED }],
    })
    expect(falsy({ e: 0 })).toBe(RED)
    expect(falsy({ e: 1 })).toBeUndefined()
    expect(falsy({})).toBe(RED) // Number(undefined||0)=0 → falsy
  })

  test('empty / nonempty use string emptiness (String(v||"") === "")', () => {
    const nonempty = fn({
      rules: [{ when: { column: 's', op: 'nonempty' }, className: RED }],
    })
    expect(nonempty({ s: 'boom' })).toBe(RED)
    expect(nonempty({ s: '' })).toBeUndefined()
    expect(nonempty({ s: null })).toBeUndefined()
    expect(nonempty({ s: 0 })).toBeUndefined() // String(0||'') === ''

    const empty = fn({
      rules: [{ when: { column: 's', op: 'empty' }, className: RED }],
    })
    expect(empty({ s: '' })).toBe(RED)
    expect(empty({ s: 'x' })).toBeUndefined()
  })
})

describe('compileRowStyle — combinators & ordering', () => {
  test('all = AND of sub-conditions', () => {
    const f = fn({
      rules: [
        {
          when: {
            all: [
              { column: 'is_done', op: 'falsy' },
              { column: 'elapsed', op: 'gt', value: 600 },
            ],
          },
          className: AMBER,
        },
      ],
    })
    expect(f({ is_done: 0, elapsed: 700 })).toBe(AMBER)
    expect(f({ is_done: 1, elapsed: 700 })).toBeUndefined() // is_done truthy
    expect(f({ is_done: 0, elapsed: 500 })).toBeUndefined() // elapsed too low
  })

  test('any = OR of sub-conditions', () => {
    const f = fn({
      rules: [
        {
          when: {
            any: [
              { column: 'a', op: 'truthy' },
              { column: 'b', op: 'truthy' },
            ],
          },
          className: RED,
        },
      ],
    })
    expect(f({ a: 1, b: 0 })).toBe(RED)
    expect(f({ a: 0, b: 1 })).toBe(RED)
    expect(f({ a: 0, b: 0 })).toBeUndefined()
  })

  test('first matching rule wins (priority order)', () => {
    const f = fn({
      rules: [
        { when: { column: 'd', op: 'gt', value: 60 }, className: RED },
        { when: { column: 'd', op: 'gt', value: 10 }, className: AMBER },
      ],
    })
    expect(f({ d: 100 })).toBe(RED) // matches first
    expect(f({ d: 30 })).toBe(AMBER) // only second
    expect(f({ d: 5 })).toBeUndefined()
  })

  test('default is returned when no rule matches', () => {
    const withDefault = fn({
      rules: [{ when: { column: 'd', op: 'gt', value: 10 }, className: RED }],
      default: '',
    })
    expect(withDefault({ d: 1 })).toBe('')

    const noDefault = fn({
      rules: [{ when: { column: 'd', op: 'gt', value: 10 }, className: RED }],
    })
    expect(noDefault({ d: 1 })).toBeUndefined()
  })
})
