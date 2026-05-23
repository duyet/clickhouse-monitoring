import { describe, expect, test } from 'bun:test'

import {
  countActiveTools,
  SKILLS,
} from '@/components/agents/welcome/skills-data'

describe('skills-data', () => {
  test('every skill exposes at least one tool', () => {
    for (const skill of SKILLS) {
      expect(skill.tools.length).toBeGreaterThan(0)
    }
  })

  test('countActiveTools dedupes overlapping tools between skills', () => {
    // Schema + Query share no tools, so the union is the sum of both.
    const both = countActiveTools(['schema', 'query'])
    const schemaOnly = countActiveTools(['schema'])
    const queryOnly = countActiveTools(['query'])
    expect(both).toBe(schemaOnly + queryOnly)
  })

  test('countActiveTools returns 0 when no skills are enabled', () => {
    expect(countActiveTools([])).toBe(0)
  })

  test('countActiveTools ignores unknown skill ids', () => {
    expect(countActiveTools(['nonexistent'])).toBe(0)
  })

  test('every skill has a stable id', () => {
    const ids = SKILLS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
