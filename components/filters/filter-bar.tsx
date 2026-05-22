'use client'

import { FilterIcon, PlusIcon, SparklesIcon, XIcon } from 'lucide-react'

import type {
  ActiveFilter,
  FilterField,
  FilterPreset,
  FilterSchema,
} from '@/lib/filters/types'
import type { QueryConfig } from '@/types/query-config'
import type { FilterDraft } from './filter-editor'

import { FilterEditor } from './filter-editor'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { OPERATORS } from '@/lib/filters/operators'
import {
  parseFiltersFromParams,
  serializeFilter,
} from '@/lib/filters/url-state'
import { useHostId } from '@/lib/swr'

interface FilterBarProps {
  queryConfig: QueryConfig
}

/**
 * Schema-driven filter bar.
 *
 * Renders one chip per active filter, an "Add filter" picker, and any
 * one-click presets — all derived from `queryConfig.filterSchema`. Filter
 * state lives entirely in the URL so it is shareable and survives reloads.
 */
export function FilterBar({ queryConfig }: FilterBarProps) {
  const schema = queryConfig.filterSchema
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const hostId = useHostId()

  const activeFilters = useMemo(
    () => (schema ? parseFiltersFromParams(schema, searchParams) : []),
    [schema, searchParams]
  )

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const queryString = params.toString()
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      })
    },
    [searchParams, router, pathname]
  )

  const setFilter = useCallback(
    (key: string, draft: FilterDraft) => {
      updateParams((params) =>
        params.set(key, serializeFilter({ key, ...draft }))
      )
    },
    [updateParams]
  )

  const removeFilter = useCallback(
    (key: string) => {
      const field = schema?.fields.find((f) => f.key === key)
      updateParams((params) => {
        // An explicit empty value overrides a field's default; otherwise drop.
        if (field?.defaultValue) params.set(key, '')
        else params.delete(key)
      })
    },
    [updateParams, schema]
  )

  const clearAll = useCallback(() => {
    updateParams((params) => {
      schema?.fields.forEach((field) => {
        if (field.defaultValue) params.set(field.key, '')
        else params.delete(field.key)
      })
    })
  }, [updateParams, schema])

  const applyPreset = useCallback(
    (preset: FilterPreset) => {
      updateParams((params) => {
        preset.filters.forEach((filter) => {
          params.set(filter.key, `${filter.operator}:${filter.value}`)
        })
      })
    },
    [updateParams]
  )

  if (!schema) return null

  const fieldByKey = new Map(schema.fields.map((field) => [field.key, field]))
  const activeKeys = activeFilters.map((filter) => filter.key)
  const hasPresets = Boolean(schema.presets && schema.presets.length > 0)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterIcon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />

      {activeFilters.map((filter) => {
        const field = fieldByKey.get(filter.key)
        if (!field) return null
        return (
          <FilterChip
            key={filter.key}
            field={field}
            filter={filter}
            configName={queryConfig.name}
            hostId={hostId}
            onChange={(draft) => setFilter(filter.key, draft)}
            onRemove={() => removeFilter(filter.key)}
          />
        )
      })}

      <AddFilterPopover
        schema={schema}
        activeKeys={activeKeys}
        configName={queryConfig.name}
        hostId={hostId}
        onAdd={setFilter}
      />

      {hasPresets && (
        <PresetsMenu presets={schema.presets ?? []} onApply={applyPreset} />
      )}

      {activeFilters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  )
}

/** Human-readable summary of an active filter for its chip. */
function formatFilterSummary(
  field: FilterField,
  filter: ActiveFilter
): { operatorLabel: string; valueText: string } {
  const operatorLabel = OPERATORS[filter.operator].label
  const { arity } = OPERATORS[filter.operator]

  if (filter.operator === 'withinHours') {
    const option = field.options?.find((o) => o.value === filter.values[0])
    return {
      operatorLabel,
      valueText: (option?.label ?? `${filter.values[0]} hours`).replace(
        /^Last\s+/i,
        ''
      ),
    }
  }

  let valueText: string
  if (arity === 2) {
    valueText = `${filter.values[0]} – ${filter.values[1]}`
  } else if (arity === 'multi') {
    valueText =
      filter.values.length > 2
        ? `${filter.values.length} selected`
        : filter.values.join(', ')
  } else {
    valueText = filter.values[0] ?? ''
  }

  if (field.unit && field.type === 'number') {
    valueText = `${valueText} ${field.unit}`
  }

  return { operatorLabel, valueText }
}

interface FilterChipProps {
  field: FilterField
  filter: ActiveFilter
  configName: string
  hostId: number
  onChange: (draft: FilterDraft) => void
  onRemove: () => void
}

/** A single active filter, rendered as an editable, removable chip. */
function FilterChip({
  field,
  filter,
  configName,
  hostId,
  onChange,
  onRemove,
}: FilterChipProps) {
  const [open, setOpen] = useState(false)
  const { operatorLabel, valueText } = formatFilterSummary(field, filter)
  const FieldIcon = field.icon

  return (
    <div className="inline-flex h-7 items-center rounded-md border bg-card pl-2 pr-0.5 text-xs shadow-sm">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {FieldIcon && (
              <FieldIcon
                className="size-3.5 text-muted-foreground"
                aria-hidden
              />
            )}
            <span className="font-medium">{field.label}</span>
            <span className="text-muted-foreground">{operatorLabel}</span>
            <span className="max-w-[180px] truncate font-semibold text-primary">
              {valueText}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <FilterEditor
            field={field}
            configName={configName}
            hostId={hostId}
            initial={{ operator: filter.operator, values: filter.values }}
            onSubmit={(draft) => {
              onChange(draft)
              setOpen(false)
            }}
            onCancel={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${field.label} filter`}
        className="ml-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  )
}

interface AddFilterPopoverProps {
  schema: FilterSchema
  activeKeys: string[]
  configName: string
  hostId: number
  onAdd: (key: string, draft: FilterDraft) => void
}

/** Two-step popover: pick a field, then edit its filter condition. */
function AddFilterPopover({
  schema,
  activeKeys,
  configName,
  hostId,
  onAdd,
}: AddFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<FilterField | null>(null)

  const availableFields = schema.fields.filter(
    (field) => !activeKeys.includes(field.key)
  )

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setSelectedField(null)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 border-dashed text-xs"
        >
          <PlusIcon className="size-3.5" />
          Add filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        {selectedField ? (
          <div className="p-3">
            <FilterEditor
              field={selectedField}
              configName={configName}
              hostId={hostId}
              onSubmit={(draft) => {
                onAdd(selectedField.key, draft)
                handleOpenChange(false)
              }}
              onCancel={() => setSelectedField(null)}
            />
          </div>
        ) : (
          <Command className="w-56">
            <CommandInput placeholder="Filter by..." className="h-9" />
            <CommandList>
              <CommandEmpty>All filters are active</CommandEmpty>
              <CommandGroup>
                {availableFields.map((field) => {
                  const FieldIcon = field.icon
                  return (
                    <CommandItem
                      key={field.key}
                      value={field.label}
                      onSelect={() => setSelectedField(field)}
                    >
                      {FieldIcon && (
                        <FieldIcon className="size-4 text-muted-foreground" />
                      )}
                      {field.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface PresetsMenuProps {
  presets: FilterPreset[]
  onApply: (preset: FilterPreset) => void
}

/** Dropdown of one-click filter bundles. */
function PresetsMenu({ presets, onApply }: PresetsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <SparklesIcon className="size-3.5" />
          Presets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {presets.map((preset) => {
          const PresetIcon = preset.icon
          return (
            <DropdownMenuItem
              key={preset.name}
              onClick={() => onApply(preset)}
              className="gap-2"
            >
              {PresetIcon && (
                <PresetIcon className="size-4 text-muted-foreground" />
              )}
              {preset.name}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
