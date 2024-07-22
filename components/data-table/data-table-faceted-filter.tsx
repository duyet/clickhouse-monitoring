'use client'

import { PlusCircledIcon } from '@radix-ui/react-icons'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Button } from '@/components/ui/button'
import type { QueryConfig } from '@/types/query-config'
import Link from 'next/link'
import { redirect, usePathname, useSearchParams } from 'next/navigation'

interface DataTableFacetedFilterProps {
  title?: string
  presets: Required<QueryConfig['filterParamPresets']>
}

export function DataTableFacetedFilter({
  title,
  presets,
}: DataTableFacetedFilterProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (!presets) return null

  const selectedValues =
    searchParams
      ?.get('__presets')
      ?.split(',')
      .map((key) => key.trim())
      .filter(Boolean) || []

  console.log('selectedValues', selectedValues)

  const resetFilter = () => redirect(pathname)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.length > 0 && ` (${selectedValues.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[170px]">
        {presets.map((preset) => {
          const isSelected = selectedValues.indexOf(preset.key) > -1

          const newSelectedValues = selectedValues.filter(
            (key) => key !== preset.key
          )
          const newParams = new URLSearchParams(searchParams)

          let href
          if (isSelected) {
            newParams.set('__presets', newSelectedValues.join(','))
            href = pathname + '?' + newParams.toString()
          } else {
            newSelectedValues.push(preset.key)
            newParams.set('__presets', newSelectedValues.join(','))
            href = pathname + '?' + newParams.toString()
          }

          return (
            <DropdownMenuCheckboxItem
              checked={isSelected}
              key={preset.key}
              onCheckedChange={() => redirect(href)}
            >
              <Link
                href={href}
                className="flex flex-row content-between items-center gap-3"
              >
                {preset.icon && (
                  <preset.icon className="mr-2 size-4 text-muted-foreground" />
                )}
                <span>{preset.name}</span>
              </Link>
            </DropdownMenuCheckboxItem>
          )
        })}

        {selectedValues.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => resetFilter()}
              className="justify-center text-center"
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
