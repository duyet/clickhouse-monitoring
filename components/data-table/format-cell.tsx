import type { Row, RowData, Table } from '@tanstack/react-table'

import { formatReadableQuantity } from '@/lib/format-readable'
import { ColumnFormat, type ColumnFormatOptions } from '@/types/column-format'

import { ActionFormat } from './cells/action-format'
import type { Action } from './cells/actions/types'
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
  type ColoredBadgeOptions,
} from './cells/colored-badge-format'
import { DurationFormat } from './cells/duration-format'
import {
  HoverCardFormat,
  type HoverCardOptions,
} from './cells/hover-card-format'
import { LinkFormat, type LinkFormatOptions } from './cells/link-format'
import {
  MarkdownFormat,
  type MarkdownFormatOptions,
} from './cells/markdown-format'
import { RelatedTimeFormat } from './cells/related-time-format'
import { TextFormat, type TextFormatOptions } from './cells/text-format'

/**
 * Props passed to all formatter components
 */
interface FormatterProps<TData extends RowData, TValue> {
  table: Table<TData>
  data: TData[]
  row: Row<TData>
  value: TValue
  columnName: string
  context: Record<string, string>
  options?: ColumnFormatOptions
}

/**
 * Inline formatters for simple value transformations
 * These don't need access to row/table context
 */
const INLINE_FORMATTERS: Partial<
  Record<ColumnFormat, (value: unknown) => React.ReactNode>
> = {
  [ColumnFormat.Code]: (value) => <code>{value as string}</code>,

  [ColumnFormat.Number]: (value) => (
    <span className="text-center text-nowrap">
      {formatReadableQuantity(value as number, 'long')}
    </span>
  ),

  [ColumnFormat.NumberShort]: (value) =>
    formatReadableQuantity(value as number, 'short'),
}

/**
 * Component formatters that only need value (and optionally options)
 */
function renderValueOnlyFormatter<TData extends RowData, TValue>(
  format: ColumnFormat,
  value: TValue,
  options?: ColumnFormatOptions
): React.ReactNode | null {
  switch (format) {
    case ColumnFormat.ColoredBadge:
      return (
        <ColoredBadgeFormat
          value={value as React.ReactNode}
          options={options as ColoredBadgeOptions}
        />
      )

    case ColumnFormat.CodeDialog:
      return (
        <CodeDialogFormat
          value={value as string}
          options={options as CodeDialogOptions}
        />
      )

    case ColumnFormat.RelatedTime:
      return <RelatedTimeFormat value={value as string} />

    case ColumnFormat.Duration:
      return <DurationFormat value={value as string | number} />

    case ColumnFormat.Boolean:
      return <BooleanFormat value={value as string | number | boolean} />

    case ColumnFormat.Badge:
      return <BadgeFormat value={value as React.ReactNode} />

    case ColumnFormat.Text:
      return (
        <TextFormat
          value={value as React.ReactNode}
          options={options as TextFormatOptions}
        />
      )

    case ColumnFormat.Markdown:
      return (
        <MarkdownFormat
          value={value as React.ReactNode}
          options={options as MarkdownFormatOptions}
        />
      )

    default:
      return null
  }
}

/**
 * Component formatters that need row context
 */
function renderRowContextFormatter<TData extends RowData, TValue>(
  format: ColumnFormat,
  props: FormatterProps<TData, TValue>
): React.ReactNode | null {
  const { table, data, row, value, columnName, context, options } = props

  switch (format) {
    case ColumnFormat.BackgroundBar:
      return (
        <BackgroundBarFormat
          table={table}
          row={row}
          columnName={columnName}
          value={value as React.ReactNode}
          options={options as BackgroundBarOptions}
        />
      )

    case ColumnFormat.CodeToggle:
      return (
        <CodeToggleFormat
          row={row}
          value={value as string}
          options={options as CodeToggleOptions}
        />
      )

    case ColumnFormat.Action:
      return (
        <ActionFormat
          row={row}
          value={value as React.ReactNode}
          actions={options as Action[]}
        />
      )

    case ColumnFormat.Link:
      return (
        <LinkFormat
          row={row}
          data={data}
          value={value as React.ReactNode}
          context={context}
          options={options as LinkFormatOptions}
        />
      )

    case ColumnFormat.HoverCard:
      return (
        <HoverCardFormat
          row={row}
          value={value as React.ReactNode}
          options={options as unknown as HoverCardOptions}
        />
      )

    default:
      return null
  }
}

/**
 * Format a cell value based on the specified format type
 *
 * Uses a layered approach:
 * 1. Inline formatters for simple value transformations
 * 2. Value-only component formatters
 * 3. Row-context component formatters
 * 4. Default fallback
 */
export const formatCell = <
  TData extends RowData,
  TValue extends React.ReactNode,
>(
  table: Table<TData>,
  data: TData[],
  row: Row<TData>,
  value: TValue,
  columnName: string,
  context: Record<string, string>,
  format: ColumnFormat,
  columnFormatOptions?: ColumnFormatOptions
) => {
  // 1. Check inline formatters first (fastest)
  const inlineFormatter = INLINE_FORMATTERS[format]
  if (inlineFormatter) {
    return inlineFormatter(value)
  }

  // 2. Check value-only component formatters
  const valueOnlyResult = renderValueOnlyFormatter(
    format,
    value,
    columnFormatOptions
  )
  if (valueOnlyResult !== null) {
    return valueOnlyResult
  }

  // 3. Check row-context component formatters
  const rowContextResult = renderRowContextFormatter(format, {
    table,
    data,
    row,
    value,
    columnName,
    context,
    options: columnFormatOptions,
  })
  if (rowContextResult !== null) {
    return rowContextResult
  }

  // 4. Default fallback
  return <span className="truncate text-wrap">{value as string}</span>
}
