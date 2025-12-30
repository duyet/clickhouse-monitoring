import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import type { Table } from '@tanstack/react-table'
import { memo, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface DataTablePaginationProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>
}

const pageSizeOptions = [10, 25, 50, 100, 200, 500, 1000]

export const DataTablePagination = memo(function DataTablePagination({
  table,
}: DataTablePaginationProps) {
  // Memoized pagination handlers to prevent recreation on every render
  const handleFirstPage = useCallback(() => {
    table.setPageIndex(0)
  }, [table])

  const handlePreviousPage = useCallback(() => {
    table.previousPage()
  }, [table])

  const handleNextPage = useCallback(() => {
    table.nextPage()
  }, [table])

  const handleLastPage = useCallback(() => {
    table.setPageIndex(table.getPageCount() - 1)
  }, [table])

  const handlePageSizeChange = useCallback(
    (value: string) => {
      table.setPageSize(Number(value))
    },
    [table]
  )

  if (table.getRowModel().rows.length === 0) return null

  return (
    <div
      aria-label="Pagination"
      className={cn(
        'flex items-center space-x-6 lg:space-x-8',
        table.getCanPreviousPage() || table.getCanNextPage() ? 'flex' : 'hidden'
      )}
    >
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">Rows per page</p>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={handlePageSizeChange}
          aria-label="Rows per page"
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
        Page {table.getState().pagination.pageIndex + 1} of{' '}
        {table.getPageCount()}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="hidden size-8 p-0 lg:flex"
          onClick={handleFirstPage}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to first page</span>
          <DoubleArrowLeftIcon className="size-4" />
        </Button>
        <Button
          variant="outline"
          className="size-8 p-0"
          onClick={handlePreviousPage}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeftIcon className="size-4" />
        </Button>
        <Button
          variant="outline"
          className="size-8 p-0"
          onClick={handleNextPage}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRightIcon className="size-4" />
        </Button>
        <Button
          variant="outline"
          className="hidden size-8 p-0 lg:flex"
          onClick={handleLastPage}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to last page</span>
          <DoubleArrowRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
})
