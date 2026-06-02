import {
  getEngineCategory,
  getEngineIconConfig,
  isViewEngine,
} from '../clickhouse-engine-icons'
import { describe, expect, it } from 'bun:test'

describe('getEngineIconConfig', () => {
  it('classifies plain MergeTree as the mergetree category', () => {
    expect(getEngineIconConfig('MergeTree').category).toBe('mergetree')
  })

  it('classifies Replicated*MergeTree variants as mergetree', () => {
    expect(getEngineIconConfig('ReplicatedMergeTree').category).toBe(
      'mergetree'
    )
    expect(getEngineIconConfig('ReplicatedReplacingMergeTree').category).toBe(
      'mergetree'
    )
  })

  it('classifies Shared*MergeTree variants as mergetree', () => {
    expect(getEngineIconConfig('SharedMergeTree').category).toBe('mergetree')
  })

  it('classifies View as view', () => {
    const config = getEngineIconConfig('View')
    expect(config.category).toBe('view')
    expect(config.label).toBe('View')
  })

  it('classifies MaterializedView as materialized-view', () => {
    expect(getEngineIconConfig('MaterializedView').category).toBe(
      'materialized-view'
    )
  })
})

describe('isViewEngine', () => {
  it('returns true for View and MaterializedView', () => {
    expect(isViewEngine('View')).toBe(true)
    expect(isViewEngine('MaterializedView')).toBe(true)
  })

  it('returns false for MergeTree-family engines', () => {
    expect(isViewEngine('MergeTree')).toBe(false)
    expect(isViewEngine('ReplicatedMergeTree')).toBe(false)
  })
})

describe('getEngineCategory', () => {
  it('mirrors getEngineIconConfig(...).category', () => {
    expect(getEngineCategory('MergeTree')).toBe(
      getEngineIconConfig('MergeTree').category
    )
    expect(getEngineCategory('View')).toBe(getEngineIconConfig('View').category)
  })
})
