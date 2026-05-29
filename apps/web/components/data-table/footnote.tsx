import type { Table } from '@tanstack/react-table'

export interface FootnoteProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>
  footnote?: string | React.ReactNode
}

export const Footnote = function Footnote({ table, footnote }: FootnoteProps) {
  return (
    <div className="min-w-0 flex-1 text-wrap break-words text-sm text-muted-foreground">
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
}
