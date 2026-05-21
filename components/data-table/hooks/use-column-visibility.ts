import type { VisibilityState } from '@tanstack/react-table'

import { useMemo, useState } from 'react'

interface UseColumnVisibilityOptions {
  configuredColumns: string[]
}

export function useColumnVisibility({
  configuredColumns,
}: UseColumnVisibilityOptions) {
  const initialColumnVisibility = useMemo(
    () =>
      configuredColumns.reduce(
        (state, col) => ({
          ...state,
          [col]: true,
        }),
        {} as VisibilityState
      ),
    [configuredColumns]
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
