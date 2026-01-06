import type { RowData } from '@tanstack/react-table'

import type { Action } from '../cells/actions/types'
import type { FormatterProps, RowContextFormatter } from './types'

import { ActionFormat } from '../cells/action-format'
import {
  BackgroundBarFormat,
  type BackgroundBarOptions,
} from '../cells/background-bar-format'
import {
  HoverCardFormat,
  type HoverCardOptions,
} from '../cells/hover-card-format'
import { LinkFormat, type LinkFormatOptions } from '../cells/link-format'
import { ColumnFormat } from '@/types/column-format'

/**
 * Action formatter - renders action menu for row operations
 *
 * @example
 * ```tsx
 * <ActionFormat
 *   row={row}
 *   value={value}
 *   actions={[{ label: 'Delete', onClick: () => {} }]}
 * />
 * ```
 */
export const actionFormatter: RowContextFormatter = <
  TData extends RowData,
  TValue,
>(
  props: FormatterProps<TData, TValue>
): React.ReactNode => {
  const { row, value, options } = props
  return (
    <ActionFormat
      row={row}
      value={value as React.ReactNode}
      actions={options as Action[]}
    />
  )
}

/**
 * Link formatter - creates clickable links with template variable replacement
 *
 * @example
 * ```tsx
 * <LinkFormat
 *   row={row}
 *   data={data}
 *   value={value}
 *   context={{ database: 'system' }}
 *   options={{ href: '/database/[database]/details' }}
 * />
 * ```
 */
export const linkFormatter: RowContextFormatter = <
  TData extends RowData,
  TValue,
>(
  props: FormatterProps<TData, TValue>
): React.ReactNode => {
  const { row, data, value, context, options } = props
  return (
    <LinkFormat
      row={row}
      data={data}
      value={value as React.ReactNode}
      context={context}
      options={options as LinkFormatOptions}
    />
  )
}

/**
 * Background bar formatter - displays value with proportional background bar
 *
 * @example
 * ```tsx
 * <BackgroundBarFormat
 *   table={table}
 *   row={row}
 *   columnName="size"
 *   value={value}
 *   options={{ numberFormat: true }}
 * />
 * ```
 */
export const backgroundBarFormatter: RowContextFormatter = <
  TData extends RowData,
  TValue,
>(
  props: FormatterProps<TData, TValue>
): React.ReactNode => {
  const { table, row, columnName, value, options } = props
  return (
    <BackgroundBarFormat
      table={table}
      row={row}
      columnName={columnName}
      value={value as React.ReactNode}
      options={options as BackgroundBarOptions}
    />
  )
}

/**
 * Hover card formatter - shows additional content on hover
 *
 * @example
 * ```tsx
 * <HoverCardFormat
 *   row={row}
 *   value={value}
 *   options={{ content: 'Additional info: [column_name]' }}
 * />
 * ```
 */
export const hoverCardFormatter: RowContextFormatter = <
  TData extends RowData,
  TValue,
>(
  props: FormatterProps<TData, TValue>
): React.ReactNode => {
  const { row, value, options } = props
  return (
    <HoverCardFormat
      row={row}
      value={value as React.ReactNode}
      options={options as HoverCardOptions}
    />
  )
}

/**
 * Registry of context formatters
 * These formatters need access to row, table, and context data
 */
export const CONTEXT_FORMATTERS: Record<
  | ColumnFormat.Action
  | ColumnFormat.BackgroundBar
  | ColumnFormat.HoverCard
  | ColumnFormat.Link,
  RowContextFormatter
> = {
  [ColumnFormat.Action]: actionFormatter,
  [ColumnFormat.BackgroundBar]: backgroundBarFormatter,
  [ColumnFormat.HoverCard]: hoverCardFormatter,
  [ColumnFormat.Link]: linkFormatter,
} as const
