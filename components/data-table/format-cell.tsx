import type { Row, RowData, Table } from '@tanstack/react-table'
import { type LinkProps } from 'next/link'

import { formatReadableQuantity } from '@/lib/format-readable'
import { ColumnFormat, type ColumnFormatOptions } from '@/types/column-format'

import { ActionFormat } from './cells/action-format'
import { type Action } from './cells/actions/types'
import {
  BackgroundBarFormat,
  type BackgroundBarOptions,
} from './cells/background-bar-format'
import { BadgeFormat } from './cells/badge-format'
import { BooleanFormat } from './cells/boolean-format'
import {
  CodeDialogFormat,
  type CodeDialogOptions,
} from './cells/code-dialog-format'
import {
  CodeToggleFormat,
  type CodeToggleOptions,
} from './cells/code-toggle-format'
import {
  ColoredBadgeFormat,
  ColoredBadgeOptions,
} from './cells/colored-badge-format'
import { DurationFormat } from './cells/duration-format'
import {
  HoverCardFormat,
  type HoverCardOptions,
} from './cells/hover-card-format'
import { LinkFormat } from './cells/link-format'
import {
  MarkdownFormat,
  type MarkdownFormatOptions,
} from './cells/markdown-format'
import { RelatedTimeFormat } from './cells/related-time-format'
import { TextFormat, type TextFormatOptions } from './cells/text-format'

export const formatCell = <
  TData extends RowData,
  TValue extends React.ReactNode,
>(
  table: Table<TData>,
  data: TData[],
  row: Row<TData>,
  value: TValue,
  columnName: string,
  format: ColumnFormat,
  columnFormatOptions?: ColumnFormatOptions
) => {
  switch (format) {
    case ColumnFormat.BackgroundBar:
      return (
        <BackgroundBarFormat
          table={table}
          row={row}
          columnName={columnName}
          value={value}
          options={columnFormatOptions as BackgroundBarOptions}
        />
      )

    case ColumnFormat.ColoredBadge:
      return (
        <ColoredBadgeFormat
          value={value}
          options={columnFormatOptions as ColoredBadgeOptions}
        />
      )

    case ColumnFormat.Code:
      return <code>{value as string}</code>

    case ColumnFormat.Number:
      return (
        <span className="text-nowrap text-center">
          {formatReadableQuantity(value as number, 'long')}
        </span>
      )

    case ColumnFormat.NumberShort:
      return formatReadableQuantity(value as number, 'short')

    case ColumnFormat.CodeToggle:
      return (
        <CodeToggleFormat
          row={row}
          value={value}
          options={columnFormatOptions as CodeToggleOptions}
        />
      )

    case ColumnFormat.CodeDialog:
      return (
        <CodeDialogFormat
          value={value}
          options={columnFormatOptions as CodeDialogOptions}
        />
      )

    case ColumnFormat.RelatedTime:
      return <RelatedTimeFormat value={value} />

    case ColumnFormat.Duration:
      return <DurationFormat value={value} />

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
          data={data}
          value={value}
          options={columnFormatOptions as LinkProps}
        />
      )

    case ColumnFormat.Text:
      return (
        <TextFormat
          value={value}
          options={columnFormatOptions as TextFormatOptions}
        />
      )

    case ColumnFormat.Markdown:
      return (
        <MarkdownFormat
          value={value}
          options={columnFormatOptions as MarkdownFormatOptions}
        />
      )

    case ColumnFormat.HoverCard:
      return (
        <HoverCardFormat
          row={row}
          value={value}
          options={columnFormatOptions as unknown as HoverCardOptions}
        />
      )

    default:
      return <span className="truncate text-wrap">{value as string}</span>
  }
}
