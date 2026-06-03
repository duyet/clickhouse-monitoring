import type { VisibilityState } from '@tanstack/react-table'

import { useState } from 'react'

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
  const initialColumnVisibility = createVisibleColumnState(configuredColumns)

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility
  )

  return {
    columnVisibility,
    setColumnVisibility,
    initialColumnVisibility,
  }
}
