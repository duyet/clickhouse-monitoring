'use client'

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { memo, useCallback, useState } from 'react'

import { useAppContext } from '@/app/context'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { ClickHouseInterval } from '@/types/clickhouse-interval'

const defaultIntervals: { value: ClickHouseInterval; label: string }[] = [
  {
    value: 'toStartOfMinute',
    label: '1m',
  },
  {
    value: 'toStartOfFiveMinutes',
    label: '5m',
  },
  {
    value: 'toStartOfTenMinutes',
    label: '10m',
  },
  {
    value: 'toStartOfFifteenMinutes',
    label: '15m',
  },
]

interface IntervalSelectProps {
  values?: { value: ClickHouseInterval; label: string }[]
}

export const IntervalSelect = memo(function IntervalSelect({ values = [] }: IntervalSelectProps) {
  const intervals = values.length ? values : defaultIntervals

  const [open, setOpen] = useState(false)
  const { interval, setInterval } = useAppContext()

  // Memoized handler to prevent recreation on every render
  const handleIntervalSelect = useCallback((currentValue: string) => {
    setInterval?.(currentValue as ClickHouseInterval)
    setOpen(false)
  }, [setInterval])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select time interval"
          className="w-[100px] justify-between"
        >
          {interval
            ? intervals.find(
                (i) => i.value.toLowerCase() === interval.toLowerCase()
              )?.label
            : 'Select...'}
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[100px] p-0">
        <Command>
          <CommandInput placeholder="Search ..." className="h-9" />
          <CommandEmpty>Not found.</CommandEmpty>
          <CommandGroup>
            {intervals.map((i) => (
              <CommandItem
                key={i.value}
                value={i.value}
                onSelect={handleIntervalSelect}
              >
                {i.label}
                <CheckIcon
                  className={cn(
                    'ml-auto size-4',
                    interval === i.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
