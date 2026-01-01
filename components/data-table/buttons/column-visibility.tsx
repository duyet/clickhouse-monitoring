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
          variant="outline"
          className="ml-auto"
          aria-label="Column Options"
          title="Column Options"
        >
          <MixerHorizontalIcon className="size-4" />
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
