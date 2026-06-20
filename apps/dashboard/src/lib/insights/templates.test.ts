import { DEFAULT_INSIGHTS_SETTINGS } from './settings'
import { INSIGHT_TEMPLATES, matchTemplate } from './templates'
import { describe, expect, it } from 'bun:test'

describe('insight templates', () => {
  it('exposes the four expected presets with unique ids', () => {
    const ids = INSIGHT_TEMPLATES.map((t) => t.id)
    expect(ids).toEqual(['quick', 'deep', 'learn', 'raw'])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every template carries a model-agnostic (null) model', () => {
    for (const t of INSIGHT_TEMPLATES) expect(t.settings.model).toBeNull()
  })

  it('matchTemplate round-trips each template bundle', () => {
    for (const t of INSIGHT_TEMPLATES) {
      expect(
        matchTemplate({ ...DEFAULT_INSIGHTS_SETTINGS, ...t.settings })
      ).toBe(t.id)
    }
  })

  it('returns null for a custom combination', () => {
    expect(
      matchTemplate({
        enrich: true,
        promptStyle: 'detailed',
        model: 'openrouter:qwen/qwen3-coder:free',
        window: '7 DAY',
      })
    ).toBeNull()
  })

  it('default settings map to the Quick scan template', () => {
    // DEFAULT = concise + enrich + 6 HOUR + null model → matches "quick".
    expect(matchTemplate(DEFAULT_INSIGHTS_SETTINGS)).toBe('quick')
  })
})
