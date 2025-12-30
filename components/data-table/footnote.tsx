import type { Table } from '@tanstack/react-table'
import { memo } from 'react'

export interface FootnoteProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>
  footnote?: string | React.ReactNode
}

export const Footnote = memo(function Footnote({
  table,
  footnote,
}: FootnoteProps) {
  return (
    <div className="text-muted-foreground flex-1 text-sm">
      {footnote ? (
        footnote
      ) : (
        <>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </>
      )}
    </div>
  )
})
