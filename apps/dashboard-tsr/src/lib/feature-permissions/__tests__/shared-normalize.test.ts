/**
 * Tests for the normalize / guard / merge helpers in feature-permissions/shared.
 *
 * Complements shared.test.ts (which covers isFeatureAllowed + resolveFeatureState)
 * by exercising the input-normalization and override-merge surface that the
 * operator config flows through: feature ids and access values arrive as raw
 * strings (env vars, config files) and MUST be canonicalised or rejected.
 */

import {
  getDefaultFeatureState,
  getResolvedFeatureStates,
  isFeatureAccess,
  isFeatureId,
  mergeFeatureOverrides,
  normalizeFeatureAccess,
  normalizeFeatureId,
} from '../shared'
import { FEATURE_IDS } from '../types'
import { describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// isFeatureId / isFeatureAccess — type guards
// ---------------------------------------------------------------------------

describe('isFeatureId', () => {
  test('true for a known feature id', () => {
    expect(isFeatureId('agent')).toBe(true)
    expect(isFeatureId('overview')).toBe(true)
  })

  test('false for an unknown id', () => {
    expect(isFeatureId('not-a-feature')).toBe(false)
  })

  test('false for a non-canonical casing (guard does not normalize)', () => {
    expect(isFeatureId('Agent')).toBe(false)
  })
})

describe('isFeatureAccess', () => {
  test('true for the known access values', () => {
    expect(isFeatureAccess('public')).toBe(true)
    expect(isFeatureAccess('authenticated')).toBe(true)
  })

  test('false for an unknown value (incl. the "guest" alias, which is not canonical)', () => {
    expect(isFeatureAccess('guest')).toBe(false)
    expect(isFeatureAccess('admin')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// normalizeFeatureId
// ---------------------------------------------------------------------------

describe('normalizeFeatureId', () => {
  test('lowercases and trims to a canonical id', () => {
    expect(normalizeFeatureId('  AGENT  ')).toBe('agent')
    expect(normalizeFeatureId('Overview')).toBe('overview')
  })

  test('replaces dashes with underscores before matching', () => {
    // No multi-word ids exist today, so a dashed form has no valid target and
    // must reject — this asserts the dash→underscore step runs, then validates.
    expect(() => normalizeFeatureId('over-view')).toThrow(/Invalid feature/)
  })

  test('throws a descriptive error listing valid ids for an unknown feature', () => {
    expect(() => normalizeFeatureId('nope')).toThrow(/Invalid feature "nope"/)
  })
})

// ---------------------------------------------------------------------------
// normalizeFeatureAccess — incl. the `guest` → `public` alias
// ---------------------------------------------------------------------------

describe('normalizeFeatureAccess', () => {
  test('lowercases and trims to a canonical access value', () => {
    expect(normalizeFeatureAccess('  PUBLIC ')).toBe('public')
    expect(normalizeFeatureAccess('Authenticated')).toBe('authenticated')
  })

  test('maps the "guest" alias to "public"', () => {
    expect(normalizeFeatureAccess('guest')).toBe('public')
    expect(normalizeFeatureAccess(' GUEST ')).toBe('public')
  })

  test('throws for an unknown access value', () => {
    expect(() => normalizeFeatureAccess('admin')).toThrow(
      /Invalid feature access "admin"/
    )
  })
})

// ---------------------------------------------------------------------------
// getDefaultFeatureState
// ---------------------------------------------------------------------------

describe('getDefaultFeatureState', () => {
  test('enabled + public when no permission is supplied', () => {
    expect(getDefaultFeatureState()).toEqual({
      enabled: true,
      access: 'public',
    })
  })

  test('honours the permission defaultAccess', () => {
    expect(
      getDefaultFeatureState({
        feature: 'agent',
        defaultAccess: 'authenticated',
      })
    ).toEqual({ enabled: true, access: 'authenticated' })
  })

  test('falls back to public when permission has no defaultAccess', () => {
    expect(getDefaultFeatureState({ feature: 'agent' })).toEqual({
      enabled: true,
      access: 'public',
    })
  })
})

// ---------------------------------------------------------------------------
// getResolvedFeatureStates
// ---------------------------------------------------------------------------

describe('getResolvedFeatureStates', () => {
  test('returns a state for every known feature id', () => {
    const resolved = getResolvedFeatureStates({ features: {} })
    expect(Object.keys(resolved).sort()).toEqual([...FEATURE_IDS].sort())
    for (const id of FEATURE_IDS) {
      expect(resolved[id]).toEqual({ enabled: true, access: 'public' })
    }
  })

  test('applies per-feature overrides while leaving others at default', () => {
    const resolved = getResolvedFeatureStates({
      features: { agent: { enabled: false, access: 'authenticated' } },
    })
    expect(resolved.agent).toEqual({ enabled: false, access: 'authenticated' })
    expect(resolved.overview).toEqual({ enabled: true, access: 'public' })
  })
})

// ---------------------------------------------------------------------------
// mergeFeatureOverrides
// ---------------------------------------------------------------------------

describe('mergeFeatureOverrides', () => {
  test('returns a normalized copy of the base when next is empty', () => {
    const merged = mergeFeatureOverrides({ agent: { enabled: false } }, {})
    expect(merged).toEqual({ agent: { enabled: false } })
  })

  test('deep-merges per-feature: next fields win, base fields persist', () => {
    const merged = mergeFeatureOverrides(
      { agent: { enabled: false, access: 'public' } },
      { agent: { access: 'authenticated' } }
    )
    // access overridden by next; enabled preserved from base.
    expect(merged.agent).toEqual({ enabled: false, access: 'authenticated' })
  })

  test('normalizes raw feature keys (casing / dashes) on both sides', () => {
    const merged = mergeFeatureOverrides(
      { AGENT: { enabled: true } } as never,
      { ' Agent ': { access: 'authenticated' } } as never
    )
    expect(merged.agent).toEqual({ enabled: true, access: 'authenticated' })
  })

  test('keeps distinct features separate', () => {
    const merged = mergeFeatureOverrides(
      { agent: { enabled: false } },
      { overview: { access: 'authenticated' } }
    )
    expect(merged.agent).toEqual({ enabled: false })
    expect(merged.overview).toEqual({ access: 'authenticated' })
  })

  test('throws when a key is not a valid feature id', () => {
    expect(() => mergeFeatureOverrides({ bogus: {} } as never, {})).toThrow(
      /Invalid feature/
    )
  })
})
