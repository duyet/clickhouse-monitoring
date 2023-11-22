import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'

import dayjs from '@/lib/dayjs'
import { formatReadableQuantity } from '@/lib/format-readable'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ColumnFormat } from '@/components/data-table/columns'

import { ActionMenu } from './actions/action-menu'
import type { Action } from './actions/types'

const CODE_TRUNCATE_LENGTH = 50

export const formatCell = (
  row: any,
  value: any,
  format: ColumnFormat,
  columnFormatOptions: Action[] = []
) => {
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
        <Accordion
          type="single"
          defaultValue={row.getIsExpanded() ? 'code' : undefined}
          collapsible={row.getIsExpanded()}
          onValueChange={(value) => row.toggleExpanded(value === 'code')}
        >
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
      return <ActionMenu value={value} actions={columnFormatOptions} />

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
