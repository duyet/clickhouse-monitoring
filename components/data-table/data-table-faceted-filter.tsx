'use client'

import { ListFilterIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ArrayElement } from '@/types/generic'
import type { QueryConfig } from '@/types/query-config'

interface DataTableFacetedFilterProps {
  title?: string
  queryConfig: QueryConfig
}

export function DataTableFacetedFilter({
  title,
  queryConfig,
}: DataTableFacetedFilterProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { filterParamPresets = [], defaultParams = {} } = queryConfig

  const selected = useMemo(
    () => new URLSearchParams(searchParams),
    [searchParams]
  )

  const filters = useMemo<
    NonNullable<QueryConfig['filterParamPresets']>
  >(() => {
    const filterNotFromPreset = Object.keys(defaultParams)
      // key in URL Params
      .filter((key) => selected.has(key))
      // And custom that value is not in presets
      .filter(
        (key) =>
          !selected.has(
            key,
            filterParamPresets.find((preset) => preset.key === key)?.value
          )
      )
      .map((key) => ({
        name: `${key} = ${selected.get(key)} *`,
        key,
        value: selected.get(key),
      })) as NonNullable<QueryConfig['filterParamPresets']>
    console.log('filterNotFromPreset', filterNotFromPreset)

    return [...filterParamPresets, ...filterNotFromPreset]
  }, [filterParamPresets, defaultParams, selected])

  const selectedCount = useMemo(
    () =>
      filters.filter(
        (filter) =>
          selected.has(filter.key) && selected.get(filter.key) === filter.value
      ).length,
    [filters, selected]
  )

  if (!filters.length) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          data-is-activate={selectedCount > 0}
          className="data-[is-activate=true]:bg-accent"
        >
          <ListFilterIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedCount > 0 && ` (${selectedCount})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-[170px]">
        {filters.map(({ name, key, value, ...preset }) => (
          <FilterMenuItem
            key={key + value}
            name={name}
            value={value}
            isSelected={selected.get(key) === value}
            href={getUpdatedHref(pathname, searchParams, key, value)}
            icon={preset?.icon}
            filterKey={key}
            filterValue={value}
          />
        ))}

        {selectedCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link
                href={pathname}
                className="flex flex-row content-between items-center gap-1"
              >
                <XIcon className="size-4" />
                Clear filters
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Component for rendering individual filter menu items
interface FilterMenuItemProps
  extends ArrayElement<NonNullable<QueryConfig['filterParamPresets']>> {
  isSelected: boolean
  href: string
  filterKey?: string
  filterValue?: string
}

function FilterMenuItem({
  name,
  isSelected,
  href,
  icon: Icon,
}: FilterMenuItemProps) {
  return (
    <DropdownMenuItem>
      <Link
        href={href}
        replace={true}
        data-selected={isSelected}
        className={cn(
          'flex flex-row content-between items-center gap-3',
          'data-[selected=true]:font-bold'
        )}
      >
        {Icon && <Icon className="mr-2 size-4 text-muted-foreground" />}
        <span>{name}</span>
      </Link>
    </DropdownMenuItem>
  )
}

// Helper function to generate updated href when a filter is toggled
function getUpdatedHref(
  pathname: string,
  searchParams: URLSearchParams,
  key: string,
  value: string
) {
  const newParams = new URLSearchParams(searchParams)
  if (newParams.get(key) === value) {
    newParams.delete(key)
  } else {
    newParams.set(key, value)
  }
  return `${pathname}?${newParams.toString()}`
}
