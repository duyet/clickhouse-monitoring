import type { TableDensity } from '@/components/data-table/hooks'

import { createContext, use } from 'react'

interface TableDensityContextValue {
  /** CSS classes applied to each table cell for density control */
  cellClassName: string
  /** Current density mode for responsive layouts */
  density: TableDensity
}

const TableDensityContext = createContext<TableDensityContextValue>({
  cellClassName: 'py-3 px-4',
  density: 'comfortable',
})

export const TableDensityProvider = TableDensityContext.Provider

export function useTableDensityContext(): TableDensityContextValue {
  return use(TableDensityContext)
}
