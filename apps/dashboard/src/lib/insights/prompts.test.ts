/**
 * Tests for lib/insights/prompts.ts
 *
 * Covers every export: constants, type-guard, resolver, prompt builder.
 * Pure logic — no ClickHouse, no LLM calls.
 */

import { describe, expect, it } from 'bun:test'
import {
  DEFAULT_PROMPT_STYLE,
  INSIGHT_PROMPT_STYLES,
  isInsightPromptStyle,
  promptSystemFor,
  resolvePromptStyle,
} from './prompts'

// ---------------------------------------------------------------------------
// DEFAULT_PROMPT_STYLE
// ---------------------------------------------------------------------------

describe('DEFAULT_PROMPT_STYLE', () => {
  it('is "concise"', () => {
    expect(DEFAULT_PROMPT_STYLE).toBe('concise')
  })

  it('is one of the known style ids in INSIGHT_PROMPT_STYLES', () => {
    const ids = INSIGHT_PROMPT_STYLES.map((s) => s.id)
    expect(ids).toContain(DEFAULT_PROMPT_STYLE)
  })
})

// ---------------------------------------------------------------------------
// INSIGHT_PROMPT_STYLES
// ---------------------------------------------------------------------------

describe('INSIGHT_PROMPT_STYLES', () => {
  it('contains exactly three styles in order: concise, detailed, beginner', () => {
    expect(INSIGHT_PROMPT_STYLES.map((s) => s.id)).toEqual([
      'concise',
      'detailed',
      'beginner',
    ])
  })

  it('each style has a non-empty id, label, description, and system', () => {
    for (const style of INSIGHT_PROMPT_STYLES) {
      expect(style.id.length).toBeGreaterThan(0)
      expect(style.label.length).toBeGreaterThan(0)
      expect(style.description.length).toBeGreaterThan(0)
      expect(style.system.length).toBeGreaterThan(0)
    }
  })

  it('all system prompts are distinct', () => {
    const systems = new Set(INSIGHT_PROMPT_STYLES.map((s) => s.system))
    expect(systems.size).toBe(INSIGHT_PROMPT_STYLES.length)
  })

  it('all labels are distinct', () => {
    const labels = new Set(INSIGHT_PROMPT_STYLES.map((s) => s.label))
    expect(labels.size).toBe(INSIGHT_PROMPT_STYLES.length)
  })

  it('each system prompt contains the shared rules fragment', () => {
    const sharedRulesFragment = 'Return exactly one entry per input, in order'
    for (const style of INSIGHT_PROMPT_STYLES) {
      expect(style.system).toContain(sharedRulesFragment)
    }
  })

  it('concise style references SRE and operator context', () => {
    const concise = INSIGHT_PROMPT_STYLES.find((s) => s.id === 'concise')!
    expect(concise.system).toContain('SRE')
    expect(concise.system.toLowerCase()).toContain('operator')
  })

  it('detailed style references root cause', () => {
    const detailed = INSIGHT_PROMPT_STYLES.find((s) => s.id === 'detailed')!
    expect(detailed.system).toContain('root cause')
  })

  it('beginner style references plain language', () => {
    const beginner = INSIGHT_PROMPT_STYLES.find((s) => s.id === 'beginner')!
    expect(beginner.system).toContain('plain language')
  })
})

// ---------------------------------------------------------------------------
// isInsightPromptStyle
// ---------------------------------------------------------------------------

describe('isInsightPromptStyle', () => {
  it('returns true for each known style id', () => {
    for (const style of INSIGHT_PROMPT_STYLES) {
      expect(isInsightPromptStyle(style.id)).toBe(true)
    }
  })

  it('returns true for "concise"', () => {
    expect(isInsightPromptStyle('concise')).toBe(true)
  })

  it('returns true for "detailed"', () => {
    expect(isInsightPromptStyle('detailed')).toBe(true)
  })

  it('returns true for "beginner"', () => {
    expect(isInsightPromptStyle('beginner')).toBe(true)
  })

  it('returns false for unknown strings', () => {
    expect(isInsightPromptStyle('expert')).toBe(false)
    expect(isInsightPromptStyle('verbose')).toBe(false)
    expect(isInsightPromptStyle('')).toBe(false)
    expect(isInsightPromptStyle('Concise')).toBe(false) // case-sensitive
  })

  it('returns false for non-string types', () => {
    expect(isInsightPromptStyle(null)).toBe(false)
    expect(isInsightPromptStyle(undefined)).toBe(false)
    expect(isInsightPromptStyle(0)).toBe(false)
    expect(isInsightPromptStyle(true)).toBe(false)
    expect(isInsightPromptStyle({})).toBe(false)
    expect(isInsightPromptStyle(['concise'])).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// resolvePromptStyle
// ---------------------------------------------------------------------------

describe('resolvePromptStyle', () => {
  it('resolves "concise" to the concise style definition', () => {
    const result = resolvePromptStyle('concise')
    expect(result.id).toBe('concise')
    expect(result.label).toBe('Concise')
  })

  it('resolves "detailed" to the detailed style definition', () => {
    const result = resolvePromptStyle('detailed')
    expect(result.id).toBe('detailed')
    expect(result.label).toBe('Detailed')
  })

  it('resolves "beginner" to the beginner style definition', () => {
    const result = resolvePromptStyle('beginner')
    expect(result.id).toBe('beginner')
    expect(result.label).toBe('Beginner-friendly')
  })

  it('falls back to the default style for an unknown string', () => {
    expect(resolvePromptStyle('nope').id).toBe(DEFAULT_PROMPT_STYLE)
    expect(resolvePromptStyle('bogus').id).toBe(DEFAULT_PROMPT_STYLE)
    expect(resolvePromptStyle('expert').id).toBe(DEFAULT_PROMPT_STYLE)
  })

  it('falls back to the default style for null', () => {
    expect(resolvePromptStyle(null).id).toBe(DEFAULT_PROMPT_STYLE)
  })

  it('falls back to the default style for undefined', () => {
    expect(resolvePromptStyle(undefined).id).toBe(DEFAULT_PROMPT_STYLE)
  })

  it('falls back to the default style for empty string', () => {
    expect(resolvePromptStyle('').id).toBe(DEFAULT_PROMPT_STYLE)
  })

  it('returns a definition whose system prompt is non-empty for every valid id', () => {
    for (const style of INSIGHT_PROMPT_STYLES) {
      expect(resolvePromptStyle(style.id).system.length).toBeGreaterThan(0)
    }
  })

  it('returns a definition object that matches INSIGHT_PROMPT_STYLES entries', () => {
    for (const expected of INSIGHT_PROMPT_STYLES) {
      const resolved = resolvePromptStyle(expected.id)
      expect(resolved).toEqual(expected)
    }
  })
})

// ---------------------------------------------------------------------------
// promptSystemFor
// ---------------------------------------------------------------------------

describe('promptSystemFor', () => {
  it('returns the concise system prompt for "concise"', () => {
    const expected = INSIGHT_PROMPT_STYLES.find(
      (s) => s.id === 'concise'
    )!.system
    expect(promptSystemFor('concise')).toBe(expected)
  })

  it('returns the detailed system prompt for "detailed"', () => {
    const expected = INSIGHT_PROMPT_STYLES.find(
      (s) => s.id === 'detailed'
    )!.system
    expect(promptSystemFor('detailed')).toBe(expected)
  })

  it('returns the beginner system prompt for "beginner"', () => {
    const expected = INSIGHT_PROMPT_STYLES.find(
      (s) => s.id === 'beginner'
    )!.system
    expect(promptSystemFor('beginner')).toBe(expected)
  })

  it('returns the default system prompt for null', () => {
    const expected = resolvePromptStyle(DEFAULT_PROMPT_STYLE).system
    expect(promptSystemFor(null)).toBe(expected)
  })

  it('returns the default system prompt for undefined', () => {
    const expected = resolvePromptStyle(DEFAULT_PROMPT_STYLE).system
    expect(promptSystemFor(undefined)).toBe(expected)
  })

  it('returns the default system prompt for an unknown style string', () => {
    const expected = resolvePromptStyle(DEFAULT_PROMPT_STYLE).system
    expect(promptSystemFor('unknown')).toBe(expected)
    expect(promptSystemFor('')).toBe(expected)
    expect(promptSystemFor('DETAILED')).toBe(expected) // case-sensitive
  })

  it('returns a non-empty string for every valid style', () => {
    for (const style of INSIGHT_PROMPT_STYLES) {
      const system = promptSystemFor(style.id)
      expect(typeof system).toBe('string')
      expect(system.length).toBeGreaterThan(0)
    }
  })

  it('output equals resolvePromptStyle(style).system for every valid id', () => {
    for (const style of INSIGHT_PROMPT_STYLES) {
      expect(promptSystemFor(style.id)).toBe(
        resolvePromptStyle(style.id).system
      )
    }
  })
})
