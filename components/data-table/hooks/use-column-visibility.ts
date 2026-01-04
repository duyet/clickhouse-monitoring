import type { VisibilityState } from '@tanstack/react-table'

import { useMemo, useState } from 'react'

interface UseColumnVisibilityOptions {
  allColumns: string[]
  configuredColumns: string[]
}

export function useColumnVisibility({
  allColumns,
  configuredColumns,
}: UseColumnVisibilityOptions) {
  const initialColumnVisibility = useMemo(
    () =>
      allColumns.reduce(
        (state, col) => ({
          ...state,
          [col]: configuredColumns.includes(col),
        }),
        {} as VisibilityState
      ),
    [allColumns, configuredColumns]
  )

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility
  )

  return {
    columnVisibility,
    setColumnVisibility,
    initialColumnVisibility,
  }
}
