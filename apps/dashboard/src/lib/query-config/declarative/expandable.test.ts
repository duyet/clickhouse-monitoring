import type { DeclarativeExpandableSpec } from './schema'

import { compileExpandable } from './expandable'
import { describe, expect, test } from 'bun:test'

// React element shape we inspect without rendering.
type Element = { type: unknown; props: Record<string, unknown> }

function renderFirst(
  spec: DeclarativeExpandableSpec,
  row: Record<string, unknown> = { name: 'x' }
): Element {
  const config = compileExpandable(spec)
  const ctx = { row: {} } as unknown as Parameters<
    typeof config.renderExpanded
  >[1]
  return config.renderExpanded(row, ctx) as unknown as Element
}

describe('compileExpandable — config-details', () => {
  test('returns an ExpandableConfig with a renderExpanded function', () => {
    const config = compileExpandable({
      type: 'config-details',
      primaryColumns: ['name'],
    })
    expect(typeof config.renderExpanded).toBe('function')
  })

  test('threads primaryColumns into the rendered element props', () => {
    const el = renderFirst({
      type: 'config-details',
      primaryColumns: ['name', 'value'],
    })
    expect(el.props.primaryColumns).toEqual(['name', 'value'])
  })

  test('threads descriptionKey into the rendered element props', () => {
    const el = renderFirst({
      type: 'config-details',
      primaryColumns: ['name'],
      descriptionKey: 'comment',
    })
    expect(el.props.descriptionKey).toBe('comment')
  })

  test('omitting primaryColumns yields an undefined prop (factory default applies)', () => {
    const el = renderFirst({ type: 'config-details' })
    expect(el.props.primaryColumns).toBeUndefined()
  })
})

describe('compileExpandable — unknown type', () => {
  test('throws loud on an unknown spec type', () => {
    // Force an off-schema type past the discriminated union to prove the
    // loader fails loud rather than silently producing no panel.
    const bad = { type: 'panel' } as unknown as DeclarativeExpandableSpec
    expect(() => compileExpandable(bad)).toThrow(/Unknown expandable spec type/)
  })
})
