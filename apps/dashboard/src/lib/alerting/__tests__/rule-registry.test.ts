/**
 * Alert Rule Registry Tests
 *
 * For every built-in rule: asserts it fires (warning/critical) AND clears (ok).
 * Also tests registry CRUD and classifyValue boundaries.
 */

import { describe, expect, test, beforeEach } from 'bun:test'
import {
  AlertRuleRegistry,
  classifyValue,
  ruleRegistry,
} from '../rule-registry'
import { BUILTIN_RULES, registerBuiltinRules } from '../builtin-rules'

// ---------------------------------------------------------------------------
// classifyValue (pure, no side effects)
// ---------------------------------------------------------------------------

describe('classifyValue', () => {
  const thresholds = { warning: 10, critical: 100 }

  test('null value → ok', () => {
    expect(classifyValue(null, thresholds)).toBe('ok')
  })

  test('NaN / Infinity → ok', () => {
    expect(classifyValue(Number.NaN, thresholds)).toBe('ok')
    expect(classifyValue(Number.POSITIVE_INFINITY, thresholds)).toBe('ok')
  })

  test('below warning → ok', () => {
    expect(classifyValue(0, thresholds)).toBe('ok')
    expect(classifyValue(9, thresholds)).toBe('ok')
  })

  test('at warning boundary → warning', () => {
    expect(classifyValue(10, thresholds)).toBe('warning')
  })

  test('between warning and critical → warning', () => {
    expect(classifyValue(50, thresholds)).toBe('warning')
    expect(classifyValue(99, thresholds)).toBe('warning')
  })

  test('at critical boundary → critical', () => {
    expect(classifyValue(100, thresholds)).toBe('critical')
  })

  test('above critical → critical', () => {
    expect(classifyValue(999, thresholds)).toBe('critical')
  })
})

// ---------------------------------------------------------------------------
// AlertRuleRegistry CRUD
// ---------------------------------------------------------------------------

describe('AlertRuleRegistry', () => {
  let registry: AlertRuleRegistry

  beforeEach(() => {
    registry = new AlertRuleRegistry()
  })

  test('starts empty', () => {
    expect(registry.size()).toBe(0)
    expect(registry.getAll()).toEqual([])
  })

  test('register and retrieve', () => {
    const rule = {
      id: 'test-rule',
      type: 'custom' as const,
      title: 'Test',
      description: 'desc',
      valueKey: 'val',
      defaults: { warning: 1, critical: 5 },
    }
    registry.register(rule)
    expect(registry.has('test-rule')).toBe(true)
    expect(registry.get('test-rule')).toEqual(rule)
    expect(registry.size()).toBe(1)
  })

  test('register overwrites same id', () => {
    const base = {
      id: 'r',
      type: 'custom' as const,
      title: 'A',
      description: '',
      valueKey: 'v',
      defaults: { warning: 1, critical: 5 },
    }
    registry.register(base)
    registry.register({ ...base, title: 'B' })
    expect(registry.get('r')?.title).toBe('B')
    expect(registry.size()).toBe(1)
  })

  test('unregister removes rule', () => {
    registry.register({
      id: 'x',
      type: 'custom' as const,
      title: 'X',
      description: '',
      valueKey: 'v',
      defaults: { warning: 1, critical: 5 },
    })
    registry.unregister('x')
    expect(registry.has('x')).toBe(false)
    expect(registry.size()).toBe(0)
  })

  test('getAll returns all registered rules', () => {
    for (const id of ['a', 'b', 'c']) {
      registry.register({
        id,
        type: 'custom' as const,
        title: id,
        description: '',
        valueKey: 'v',
        defaults: { warning: 1, critical: 5 },
      })
    }
    expect(
      registry
        .getAll()
        .map((r) => r.id)
        .sort()
    ).toEqual(['a', 'b', 'c'])
  })
})

// ---------------------------------------------------------------------------
// registerBuiltinRules populates the global registry
// ---------------------------------------------------------------------------

describe('registerBuiltinRules', () => {
  test('registers all BUILTIN_RULES into the singleton', () => {
    registerBuiltinRules()
    for (const rule of BUILTIN_RULES) {
      expect(ruleRegistry.has(rule.id)).toBe(true)
    }
  })

  test('all built-in rules have required fields', () => {
    for (const rule of BUILTIN_RULES) {
      expect(typeof rule.id).toBe('string')
      expect(rule.id.length).toBeGreaterThan(0)
      expect(typeof rule.title).toBe('string')
      expect(typeof rule.valueKey).toBe('string')
      expect(typeof rule.defaults.warning).toBe('number')
      expect(typeof rule.defaults.critical).toBe('number')
      expect(rule.defaults.warning).toBeLessThanOrEqual(rule.defaults.critical)
    }
  })
})

// ---------------------------------------------------------------------------
// Per-rule trigger / clear tests
// ---------------------------------------------------------------------------

describe('readonly-replicas rule', () => {
  const rule = BUILTIN_RULES.find((r) => r.id === 'readonly-replicas')!

  test('fires warning at threshold', () => {
    expect(classifyValue(rule.defaults.warning, rule.defaults)).toBe('warning')
  })

  test('fires critical at threshold', () => {
    expect(classifyValue(rule.defaults.critical, rule.defaults)).toBe(
      'critical'
    )
  })

  test('clears when value is 0', () => {
    expect(classifyValue(0, rule.defaults)).toBe('ok')
  })

  test('clears on null', () => {
    expect(classifyValue(null, rule.defaults)).toBe('ok')
  })
})

describe('replication-lag rule', () => {
  const rule = BUILTIN_RULES.find((r) => r.id === 'replication-lag')!

  test('clears below warning (29s)', () => {
    expect(classifyValue(29, rule.defaults)).toBe('ok')
  })

  test('fires warning at 30s', () => {
    expect(classifyValue(30, rule.defaults)).toBe('warning')
  })

  test('fires critical at 300s', () => {
    expect(classifyValue(300, rule.defaults)).toBe('critical')
  })

  test('fires critical above 300s', () => {
    expect(classifyValue(600, rule.defaults)).toBe('critical')
  })
})

describe('disk-usage rule', () => {
  const rule = BUILTIN_RULES.find((r) => r.id === 'disk-usage')!

  test('ok at 79%', () => {
    expect(classifyValue(79, rule.defaults)).toBe('ok')
  })

  test('warning at 80%', () => {
    expect(classifyValue(80, rule.defaults)).toBe('warning')
  })

  test('critical at 95%', () => {
    expect(classifyValue(95, rule.defaults)).toBe('critical')
  })
})

describe('keeper-unavailable rule', () => {
  const rule = BUILTIN_RULES.find((r) => r.id === 'keeper-unavailable')!

  test('ok at 0 exceptions', () => {
    expect(classifyValue(0, rule.defaults)).toBe('ok')
  })

  test('warning at 1 exception', () => {
    expect(classifyValue(1, rule.defaults)).toBe('warning')
  })

  test('critical at 20 exceptions', () => {
    expect(classifyValue(20, rule.defaults)).toBe('critical')
  })
})

describe('failed-mutations rule', () => {
  const rule = BUILTIN_RULES.find((r) => r.id === 'failed-mutations')!

  test('ok when no failures', () => {
    expect(classifyValue(0, rule.defaults)).toBe('ok')
  })

  test('fires warning on first failure', () => {
    expect(classifyValue(1, rule.defaults)).toBe('warning')
  })

  test('fires critical at 5', () => {
    expect(classifyValue(5, rule.defaults)).toBe('critical')
  })

  test('clears on null (table absent)', () => {
    expect(classifyValue(null, rule.defaults)).toBe('ok')
  })
})

describe('stuck-merges rule', () => {
  const rule = BUILTIN_RULES.find((r) => r.id === 'stuck-merges')!

  test('ok when no stuck merges', () => {
    expect(classifyValue(0, rule.defaults)).toBe('ok')
  })

  test('warning at 1 stuck merge', () => {
    expect(classifyValue(1, rule.defaults)).toBe('warning')
  })

  test('critical at 3 stuck merges', () => {
    expect(classifyValue(3, rule.defaults)).toBe('critical')
  })
})

describe('query-timeout rule', () => {
  const rule = BUILTIN_RULES.find((r) => r.id === 'query-timeout')!

  test('ok at 0 timeouts', () => {
    expect(classifyValue(0, rule.defaults)).toBe('ok')
  })

  test('warning at 1 timeout', () => {
    expect(classifyValue(1, rule.defaults)).toBe('warning')
  })

  test('critical at 10 timeouts', () => {
    expect(classifyValue(10, rule.defaults)).toBe('critical')
  })
})

describe('failed-backups rule', () => {
  const rule = BUILTIN_RULES.find((r) => r.id === 'failed-backups')!

  test('ok when no failures', () => {
    expect(classifyValue(0, rule.defaults)).toBe('ok')
  })

  test('warning at 1 failure', () => {
    expect(classifyValue(1, rule.defaults)).toBe('warning')
  })

  test('critical at 3 failures', () => {
    expect(classifyValue(3, rule.defaults)).toBe('critical')
  })
})

describe('mv-refresh-failures rule', () => {
  const rule = BUILTIN_RULES.find((r) => r.id === 'mv-refresh-failures')!

  test('ok when no failures', () => {
    expect(classifyValue(0, rule.defaults)).toBe('ok')
  })

  test('warning at 1 failure', () => {
    expect(classifyValue(1, rule.defaults)).toBe('warning')
  })

  test('critical at 3 failures', () => {
    expect(classifyValue(3, rule.defaults)).toBe('critical')
  })

  test('clears on null (table absent)', () => {
    expect(classifyValue(null, rule.defaults)).toBe('ok')
  })
})
