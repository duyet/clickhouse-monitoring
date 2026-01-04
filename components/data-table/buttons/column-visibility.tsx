import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import type { Table } from '@tanstack/react-table'

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ColumnVisibilityButtonProps {
  // Using 'any' since the component only uses table methods that don't depend on TData
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>
}

export const ColumnVisibilityButton = memo(function ColumnVisibilityButton({
  table,
}: ColumnVisibilityButtonProps) {
  const handleSelect = useCallback((event: Event) => {
    event.preventDefault()
    // Prevent default selection behavior to avoid
    // unintended interactions with checkbox state
  }, [])

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 sm:size-5 opacity-40 hover:opacity-100 transition-opacity rounded-full"
          aria-label="Column Options"
          title="Column Options"
        >
          <MixerHorizontalIcon className="size-3 sm:size-3" strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[60vh] overflow-y-auto"
        sticky="always"
      >
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={handleSelect}
                role="checkbox"
                aria-label={column.id}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
