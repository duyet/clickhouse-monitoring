'use client'

import { useState } from 'react'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'
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
import { useAppContext } from '@/app/context'

export type ClickHouseIntervalFunc =
  | 'toStartOfMinute'
  | 'toStartOfFiveMinutes'
  | 'toStartOfTenMinutes'
  | 'toStartOfFifteenMinutes'

const defaultIntervals: { value: ClickHouseIntervalFunc; label: string }[] = [
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
  values?: { value: ClickHouseIntervalFunc; label: string }[]
}

export function IntervalSelect({ values = [] }: IntervalSelectProps) {
  const intervals = values.length ? values : defaultIntervals

  const [open, setOpen] = useState(false)
  const { interval, setInterval } = useAppContext()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-[100px] justify-between'
        >
          {interval
            ? intervals.find(
                (i) => i.value.toLowerCase() === interval.toLowerCase(),
              )?.label
            : 'Select...'}
          <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[100px] p-0'>
        <Command>
          <CommandInput placeholder='Search ...' className='h-9' />
          <CommandEmpty>Not found.</CommandEmpty>
          <CommandGroup>
            {intervals.map((i) => (
              <CommandItem
                key={i.value}
                value={i.value}
                onSelect={(currentValue: string) => {
                  setInterval?.(currentValue as ClickHouseIntervalFunc)
                  setOpen(false)
                }}
              >
                {i.label}
                <CheckIcon
                  className={cn(
                    'ml-auto h-4 w-4',
                    interval === i.value ? 'opacity-100' : 'opacity-0',
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
