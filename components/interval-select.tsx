'use client'

import * as React from 'react'
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

const intervals = [
  {
    value: '30',
    label: '30s',
  },
  {
    value: '60',
    label: '1m',
  },
  {
    value: '300',
    label: '5m',
  },
  {
    value: '900',
    label: '15m',
  },
  {
    value: '1800',
    label: '30m',
  },
]

export function IntervalSelect() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string>(intervals[2].value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-[100px] justify-between'
        >
          {value
            ? intervals.find((interval) => interval.value === value)?.label
            : 'Select...'}
          <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[100px] p-0'>
        <Command>
          <CommandInput placeholder='Search ...' className='h-9' />
          <CommandEmpty>Not found.</CommandEmpty>
          <CommandGroup>
            {intervals.map((interval) => (
              <CommandItem
                key={interval.value}
                value={interval.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? '' : currentValue)
                  setOpen(false)
                }}
              >
                {interval.label}
                <CheckIcon
                  className={cn(
                    'ml-auto h-4 w-4',
                    value === interval.value ? 'opacity-100' : 'opacity-0',
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
