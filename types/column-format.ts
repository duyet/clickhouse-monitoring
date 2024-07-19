import { LinkProps } from 'next/link'

import { type Action } from '@/components/data-table/cells/actions/types'
import { type HoverCardOptions } from '@/components/data-table/cells/hover-card-format'

export enum ColumnFormat {
  BackgroundBar = 'background-bar',
  ColoredBadge = 'colored-badge',
  RelatedTime = 'related-time',
  NumberShort = 'number-short',
  CodeToggle = 'code-toggle',
  HoverCard = 'hover-card',
  Duration = 'duration',
  Boolean = 'boolean',
  Action = 'action',
  Number = 'number',
  Badge = 'badge',
  Code = 'code',
  Link = 'link',
  None = 'none',
}

export type ColumnFormatWithArgs =
  | [ColumnFormat.Action, Action[]]
  | [ColumnFormat.Link, LinkProps]
  | [ColumnFormat.HoverCard, HoverCardOptions]

// Union of all possible format options
export type ColumnFormatOptions = ColumnFormatWithArgs[1]
