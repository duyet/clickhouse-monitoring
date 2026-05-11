import type { DataPart } from '@json-render/react'
import type React from 'react'

import { describe, expect, mock, test } from 'bun:test'

mock.module('swr', () => ({
  default: mock(() => ({})),
  mutate: mock(() => Promise.resolve()),
  preload: mock(() => Promise.resolve()),
  SWRConfig: ({ children }: { children: React.ReactNode }) => children,
  useSWRConfig: mock(() => ({ mutate: mock(() => Promise.resolve()) })),
  unstable_serialize: mock((key: unknown) => JSON.stringify(key)),
}))

import { validateAndSanitizeSpecFromParts } from '@/components/agents/chat/message'
import {
  AGENT_JSON_RENDER_MAX_ELEMENT_COUNT,
  AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES,
  AGENT_JSON_RENDER_MAX_SPEC_PARTS,
} from '@/lib/ai/agent/json-render-catalog'

const baseSpec = {
  root: 'card-root',
  elements: {
    'card-root': {
      type: 'Card',
      props: { title: 'Root' },
      children: [],
    },
  },
}

describe('validateAndSanitizeSpecFromParts', () => {
  test('returns text-only fallback when no UI spec exists', () => {
    const result = validateAndSanitizeSpecFromParts([], {
      spec: null,
      text: 'Explain query result',
      hasSpec: false,
    })

    expect(result.hasSpec).toBe(false)
    expect(result.spec).toBe(null)
    expect(result.parseError).toBeNull()
  })

  test('accepts a valid inline UI spec', () => {
    const parts: DataPart[] = [
      { type: 'text', text: 'Generating card...' },
      { type: 'data-spec', data: baseSpec },
    ]
    const result = validateAndSanitizeSpecFromParts(parts, {
      spec: baseSpec,
      text: 'Generating card...',
      hasSpec: true,
    })

    expect(result.hasSpec).toBe(true)
    expect(result.spec).toMatchObject(baseSpec)
    expect(result.parseError).toBeNull()
  })

  test('rejects unknown component types from untrusted specs', () => {
    const parts: DataPart[] = [{ type: 'data-spec', data: 'ignore-this' }]
    const result = validateAndSanitizeSpecFromParts(parts, {
      spec: {
        root: 'forbidden',
        elements: {
          forbidden: {
            type: 'NotAllowedComponent',
            props: {},
            children: [],
          },
        },
      },
      text: '',
      hasSpec: true,
    })

    expect(result.hasSpec).toBe(false)
    expect(result.spec).toBe(null)
    expect(result.parseError).toBe(
      'Generated UI spec is invalid. Skipping inline rendering for safety.'
    )
  })

  test('rejects oversized patch payloads before rendering', () => {
    const parts: DataPart[] = [
      {
        type: 'data-spec',
        data: 'x'.repeat(AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES + 1),
      },
    ]
    const result = validateAndSanitizeSpecFromParts(parts, {
      spec: baseSpec,
      text: 'Patch data too large',
      hasSpec: true,
    })

    expect(result.hasSpec).toBe(false)
    expect(result.parseError).toBe(
      `Inline UI patch data exceeded per-part limit (${AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES} bytes).`
    )
  })

  test('rejects too many patch blocks', () => {
    const parts: DataPart[] = Array.from(
      { length: AGENT_JSON_RENDER_MAX_SPEC_PARTS + 1 },
      () => ({ type: 'data-spec', data: { op: 'noop' } })
    )
    const result = validateAndSanitizeSpecFromParts(parts, {
      spec: baseSpec,
      text: 'Too many patches',
      hasSpec: true,
    })

    expect(result.hasSpec).toBe(false)
    expect(result.parseError).toContain('Too many inline UI patches')
  })

  test('rejects too large generated trees', () => {
    const elements: Record<
      string,
      { type: 'Card'; props: { title: string }; children: string[] }
    > = {}
    for (let i = 0; i < AGENT_JSON_RENDER_MAX_ELEMENT_COUNT + 1; i += 1) {
      elements[`card-${i}`] = {
        type: 'Card',
        props: { title: `Card ${i}` },
        children: [],
      }
    }

    const tooBigSpec = {
      root: 'card-0',
      elements,
    }
    const parts: DataPart[] = [{ type: 'data-spec', data: tooBigSpec }]

    const result = validateAndSanitizeSpecFromParts(parts, {
      spec: tooBigSpec,
      text: 'Too many cards',
      hasSpec: true,
    })

    expect(result.hasSpec).toBe(false)
    expect(result.parseError).toContain('too many elements')
  })
})
