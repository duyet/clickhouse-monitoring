import type { QueryConfig } from '@/types/query-config'

import { useTableBehavior } from '../use-table-behavior'
import { describe, expect, it } from 'bun:test'

function makeConfig(tableBehavior?: QueryConfig['tableBehavior']): QueryConfig {
  return {
    name: 'test',
    sql: 'SELECT 1',
    columns: [],
    tableBehavior,
  } as unknown as QueryConfig
}

describe('useTableBehavior', () => {
  it('returns the global defaults when nothing is configured', () => {
    const result = useTableBehavior({ queryConfig: makeConfig() })

    expect(result).toEqual({
      enableColumnResizing: true,
      columnResizeMode: 'onChange',
      enableSorting: true,
      enableColumnReordering: true,
    })
  })

  it('honors queryConfig.tableBehavior overrides', () => {
    const result = useTableBehavior({
      queryConfig: makeConfig({
        enableColumnResizing: false,
        columnResizeMode: 'onEnd',
        enableSorting: false,
        enableColumnReordering: false,
      }),
    })

    expect(result).toEqual({
      enableColumnResizing: false,
      columnResizeMode: 'onEnd',
      enableSorting: false,
      enableColumnReordering: false,
    })
  })

  it('lets the prop override queryConfig for enableColumnReordering', () => {
    const result = useTableBehavior({
      queryConfig: makeConfig({ enableColumnReordering: false }),
      enableColumnReorderingProp: true,
    })

    expect(result.enableColumnReordering).toBe(true)
  })

  it('falls back to queryConfig when the prop is undefined', () => {
    const result = useTableBehavior({
      queryConfig: makeConfig({ enableColumnReordering: false }),
      enableColumnReorderingProp: undefined,
    })

    expect(result.enableColumnReordering).toBe(false)
  })

  it('only resolves the reordering flag from props; resizing stays from config', () => {
    const result = useTableBehavior({
      queryConfig: makeConfig({ enableColumnResizing: false }),
      enableColumnReorderingProp: false,
    })

    expect(result.enableColumnResizing).toBe(false)
    expect(result.enableColumnReordering).toBe(false)
  })
})
