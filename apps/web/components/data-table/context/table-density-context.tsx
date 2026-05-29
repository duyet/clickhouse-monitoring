'use client'

import { createContext, use } from 'react'

interface TableDensityContextValue {
  /** CSS classes applied to each table cell for density control */
  cellClassName: string
}

const TableDensityContext = createContext<TableDensityContextValue>({
  cellClassName: 'py-3 px-4',
})

export const TableDensityProvider = TableDensityContext.Provider

export function useTableDensityContext(): TableDensityContextValue {
  return use(TableDensityContext)
}
