'use client'

import {
  ColumnsIcon,
  FilterIcon,
  LayoutListIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'

import type { QueryConfig } from '@/types/query-config'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface QueryFiltersBarProps {
  queryConfig: QueryConfig
  hostId: number
}

export function QueryFiltersBar({ queryConfig, hostId }: QueryFiltersBarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get current filter values from URL
  const activeFilters = useMemo(() => {
    const filters: Record<string, string> = {}
    queryConfig.defaultParams &&
      Object.entries(queryConfig.defaultParams).forEach(
        ([key, defaultValue]) => {
          const value = searchParams.get(key)
          if (value && value !== defaultValue) {
            filters[key] = value
          }
        }
      )
    return filters
  }, [searchParams, queryConfig.defaultParams])

  // Update URL with new filter
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.replace(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      })
    },
    [searchParams, router]
  )

  // Remove all filters
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    Object.keys(activeFilters).forEach((key) => params.delete(key))
    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    })
  }, [searchParams, router, activeFilters])

  // Toggle preset filter
  const togglePreset = useCallback(
    (preset: { key: string; value: string }) => {
      const currentValue = searchParams.get(preset.key)
      const newValue = currentValue === preset.value ? '' : preset.value
      updateFilter(preset.key, newValue)
    },
    [searchParams, updateFilter]
  )

  // Quick filter presets (subset of all presets)
  const quickPresets = useMemo(() => {
    return (
      queryConfig.filterParamPresets?.filter(
        (p) =>
          p.key === 'query_kind' ||
          p.key === 'min_duration_s' ||
          p.key === 'min_memory_mb' ||
          p.key === 'min_read_rows' ||
          p.key === 'type'
      ) || []
    )
  }, [queryConfig.filterParamPresets])

  // Check if a preset is active
  const isPresetActive = useCallback(
    (preset: { key: string; value: string }) => {
      return searchParams.get(preset.key) === preset.value
    },
    [searchParams]
  )

  const activeFilterCount = Object.keys(activeFilters).length

  return (
    <div className="flex flex-col gap-3">
      {/* Main filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <InputGroup className="flex-1 min-w-[200px] max-w-[400px]">
          <InputGroupInput
            placeholder="Search queries..."
            value={searchParams.get('query_text') || ''}
            onChange={(e) => updateFilter('query_text', e.target.value)}
            className="h-8"
          />
          <InputGroupAddon align="inline-end">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>

        {/* Query ID input */}
        <InputGroup className="w-[180px]">
          <InputGroupInput
            placeholder="Query ID"
            value={searchParams.get('query_id') || ''}
            onChange={(e) => updateFilter('query_id', e.target.value)}
            className="h-8"
          />
        </InputGroup>

        {/* Advanced filters toggle */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <FilterIcon className="h-4 w-4" />
              Advanced
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto h-5 min-w-5 rounded-full px-1"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="start">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Resource Filters</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Memory &gt;
                    </label>
                    <InputGroup>
                      <InputGroupInput
                        placeholder="MB"
                        type="number"
                        value={searchParams.get('min_memory_mb') || ''}
                        onChange={(e) =>
                          updateFilter('min_memory_mb', e.target.value)
                        }
                        className="h-8"
                      />
                      <InputGroupAddon className="bg-muted/50">
                        MB
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Read Rows &gt;
                    </label>
                    <InputGroup>
                      <InputGroupInput
                        placeholder="Rows"
                        type="number"
                        value={searchParams.get('min_read_rows') || ''}
                        onChange={(e) =>
                          updateFilter('min_read_rows', e.target.value)
                        }
                        className="h-8"
                      />
                      <InputGroupAddon className="bg-muted/50">
                        rows
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Query Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">
                      Query Kind
                    </label>
                    <Select
                      value={searchParams.get('query_kind') || ''}
                      onValueChange={(value) =>
                        updateFilter('query_kind', value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All kinds" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Select">Select</SelectItem>
                        <SelectItem value="Insert">Insert</SelectItem>
                        <SelectItem value="System">QueryFinish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick filter chips */}
      {quickPresets && quickPresets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick Filters:</span>
          {quickPresets.slice(0, 8).map((preset) => (
            <Badge
              key={`${preset.key}-${preset.value}`}
              variant={isPresetActive(preset) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors hover:bg-primary/80',
                isPresetActive(preset) && 'bg-primary text-primary-foreground'
              )}
              onClick={() => togglePreset(preset)}
            >
              {preset.name}
              {isPresetActive(preset) && <XIcon className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      )}

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active:</span>
          {Object.entries(activeFilters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="gap-1 pr-1 text-xs">
              {key}: {value.length > 20 ? `${value.slice(0, 20)}...` : value}
              <button
                onClick={() => updateFilter(key, '')}
                className="hover:bg-destructive/20 rounded-full p-0.5"
                aria-label={`Remove ${key} filter`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
