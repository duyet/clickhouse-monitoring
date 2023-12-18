import { type LinkProps } from 'next/link'

import dayjs from '@/lib/dayjs'
import { formatReadableQuantity } from '@/lib/format-readable'
import {
  ColumnFormat,
  ColumnFormatOptions,
} from '@/components/data-table/columns'

import { ActionFormat } from './cells/action-format'
import { type Action } from './cells/actions/types'
import { BadgeFormat } from './cells/badge-format'
import { BooleanFormat } from './cells/boolean-format'
import { CodeToggleFormat } from './cells/code-toggle-format'
import { ColoredBadgeFormat } from './cells/colored-badge-format'
import { LinkFormat } from './cells/link-format'

export const formatCell = (
  row: any,
  value: any,
  format: ColumnFormat,
  columnFormatOptions?: ColumnFormatOptions
) => {
  switch (format) {
    case ColumnFormat.ColoredBadge:
      return <ColoredBadgeFormat value={value} />

    case ColumnFormat.Code:
      return <code>{value}</code>

    case ColumnFormat.Number:
      return formatReadableQuantity(value, 'long')

    case ColumnFormat.NumberShort:
      return formatReadableQuantity(value, 'short')

    case ColumnFormat.CodeToggle:
      return <CodeToggleFormat row={row} value={value} />

    case ColumnFormat.RelatedTime:
      let fromNow = dayjs(value).fromNow()
      return <span title={value}>{fromNow}</span>

    case ColumnFormat.Duration:
      let humanized = dayjs.duration({ seconds: parseFloat(value) }).humanize()
      return <span title={value}>{humanized}</span>

    case ColumnFormat.Boolean:
      return <BooleanFormat value={value} />

    case ColumnFormat.Action:
      return (
        <ActionFormat
          row={row}
          value={value}
          actions={columnFormatOptions as Action[]}
        />
      )

    case ColumnFormat.Badge:
      return <BadgeFormat value={value} />

    case ColumnFormat.Link:
      return (
        <LinkFormat
          row={row}
          value={value}
          options={columnFormatOptions as LinkProps}
        />
      )

    default:
      return value
  }
}
