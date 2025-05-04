import type { Table } from '@tanstack/react-table'

export interface FootnoteProps<TData> {
  table: Table<TData>
  footnote?: string | React.ReactNode
}

export function Footnote<TData>({ table, footnote }: FootnoteProps<TData>) {
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
}
