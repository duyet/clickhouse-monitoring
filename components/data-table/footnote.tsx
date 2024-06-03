import type { Table } from '@tanstack/react-table'

export interface FootnoteProps<TData> {
  table: Table<TData>
  footnote?: string | React.ReactNode
}

export function Footnote<TData>({ table, footnote }: FootnoteProps<TData>) {
  return (
    <div className="flex-1 text-sm text-muted-foreground">
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
