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
  // Memoized so we don't rebuild the visibility object on every render. The
  // value is also returned (the table reads it for `initialState`), so a lazy
  // useState initializer alone wouldn't suffice — keep it available via memo.
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
