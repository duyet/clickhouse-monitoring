import { MoreHorizontal } from 'lucide-react'
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'

import dayjs from '@/lib/dayjs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnFormat } from '@/components/data-table/columns'

export const formatCell = (value: any, format: ColumnFormat) => {
  switch (format) {
    case ColumnFormat.Code:
      return <code>{value}</code>

    case ColumnFormat.Duration:
      return dayjs.duration({ seconds: parseFloat(value) }).humanize()

    case ColumnFormat.Boolean:
      return value ? (
        <CheckCircledIcon className='text-green-700' />
      ) : (
        <CrossCircledIcon className='text-rose-700' />
      )

    case ColumnFormat.Action:
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Kill Query</DropdownMenuItem>
            <DropdownMenuItem>Detail</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

    default:
      return value
  }
}
