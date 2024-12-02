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

  const selected = useMemo(() => {
    const params = new URLSearchParams(searchParams)

    // Add default params have not null value
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value !== '' && !params.has(key)) {
        params.set(key, value as string)
      }
    })

    return params
  }, [searchParams, defaultParams])
  console.log('selected', selected.toString())

  const filters = useMemo<
    NonNullable<QueryConfig['filterParamPresets']>
  >(() => {
    const filterNotFromPreset = Object.keys(defaultParams)
      // Key in URL Params
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
        key,
        name: selected.get(key)
          ? filterParamPresets.find((preset) => preset.key === key)?.name
          : `${key} = N/A`,
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
            href={getUpdatedHref(
              pathname,
              searchParams,
              key,
              value,
              defaultParams
            )}
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
      <a
        href={href}
        data-selected={isSelected}
        className={cn(
          'flex flex-row content-between items-center gap-3',
          'data-[selected=true]:font-bold'
        )}
      >
        {Icon && <Icon className="mr-2 size-4 text-muted-foreground" />}
        <span>{name}</span>
      </a>
    </DropdownMenuItem>
  )
}

// Helper function to generate updated href when a filter is toggled
function getUpdatedHref(
  pathname: string,
  searchParams: URLSearchParams,
  key: string,
  value: string,
  defaultParams: QueryConfig['defaultParams']
) {
  const newParams = new URLSearchParams(searchParams)
  if (newParams.get(key) === value) {
    /**
     * For example the query config has defaultParams = { type: 'abc' }
     * and the URL has ?type=abc. If the user clicks on the filter to toggle it off,
     * We should set the URL to ?type= instead of removing the key completely,
     * as the default value is still 'abc'.
     */
    if (defaultParams?.[key] !== '') {
      newParams.set(key, '')
    } else {
      /**
       * If the default value is an empty string, we can just remove the key from the URL
       * as there is no default value to fall back to.
       *
       * For example, if the query config has defaultParams = { type: '' }
       * and the URL has ?type=abc. If the user clicks on the filter to toggle it off,
       * We can set the URL to ? instead of ?type=abc.
       */
      newParams.delete(key)
    }
  } else {
    /**
     * If the filter is not selected, we should set the URL to ?key=value
     */
    newParams.set(key, value)
  }
  return `${pathname}?${newParams.toString()}`
}
