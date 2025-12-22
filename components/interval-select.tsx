'use client'

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { useState } from 'react'

import { useAppContext } from '@/app/context'
import { Button } from '@/components/ui'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
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

export function IntervalSelect({ values = [] }: IntervalSelectProps) {
  const intervals = values.length ? values : defaultIntervals

  const [open, setOpen] = useState(false)
  const { interval, setInterval } = useAppContext()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
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
                onSelect={(currentValue: string) => {
                  setInterval?.(currentValue as ClickHouseInterval)
                  setOpen(false)
                }}
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
}
