import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'
import { MoreHorizontal } from 'lucide-react'

import dayjs from '@/lib/dayjs'
import { formatReadableQuantity } from '@/lib/format-readable'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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

const CODE_TRUNCATE_LENGTH = 50

export const formatCell = (row: any, value: any, format: ColumnFormat) => {
  switch (format) {
    case ColumnFormat.Code:
      return <code>{value}</code>

    case ColumnFormat.Number:
      return formatReadableQuantity(value, 'long')

    case ColumnFormat.NumberShort:
      return formatReadableQuantity(value, 'short')

    case ColumnFormat.CodeToggle:
      if (value.length < CODE_TRUNCATE_LENGTH) {
        return <code>{value}</code>
      }

      return (
        <Accordion type="single" collapsible={row.getIsExpanded()}>
          <AccordionItem value="code" className="border-0">
            <AccordionTrigger className="py-0 hover:no-underline">
              <code className="truncate break-words font-normal">
                {value.substring(0, 50)}...
              </code>
            </AccordionTrigger>
            <AccordionContent>
              <code className="whitespace-pre-wrap font-normal">
                {value.substring(50)}
              </code>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )

    case ColumnFormat.RelatedTime:
      let fromNow = dayjs(value).fromNow()
      return <span title={value}>{fromNow}</span>

    case ColumnFormat.Duration:
      let humanized = dayjs.duration({ seconds: parseFloat(value) }).humanize()
      return <span title={value}>{humanized}</span>

    case ColumnFormat.Boolean:
      return value ? (
        <CheckCircledIcon className="text-green-700" />
      ) : (
        <CrossCircledIcon className="text-rose-700" />
      )

    case ColumnFormat.Action:
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Kill Query</DropdownMenuItem>
            <DropdownMenuItem>Detail</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

    case ColumnFormat.Badge:
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          {value}
        </span>
      )

    default:
      return value
  }
}
