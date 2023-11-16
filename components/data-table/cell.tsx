import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'
import { MoreHorizontal } from 'lucide-react'

import dayjs from '@/lib/dayjs'
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

export const formatCell = (row: any, value: any, format: ColumnFormat) => {
  switch (format) {
    case ColumnFormat.Code:
      return <code>{value}</code>

    case ColumnFormat.CodeToggle:
      return (
        <Accordion type="single" collapsible={row.getIsExpanded()}>
          <AccordionItem value="code" className="border-0">
            <AccordionTrigger className="py-0 hover:no-underline">
              <code className="truncate break-words font-normal">
                {value.substring(0, 50)}
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

    case ColumnFormat.Duration:
      return dayjs.duration({ seconds: parseFloat(value) }).humanize()

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

    default:
      return value
  }
}
