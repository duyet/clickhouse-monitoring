import type { VisibilityState } from '@tanstack/react-table'

import { useMemo, useState } from 'react'

interface UseColumnVisibilityOptions {
  configuredColumns: string[]
}

function createVisibleColumnState(columns: string[]): VisibilityState {
  return Object.fromEntries(
    columns.map((col) => [col, true])
  ) as VisibilityState
}

export function useColumnVisibility({
  configuredColumns,
}: UseColumnVisibilityOptions) {
  const initialColumnVisibility = useMemo(
    () => createVisibleColumnState(configuredColumns),
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
