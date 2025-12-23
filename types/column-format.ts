import type {
  Action,
  BackgroundBarOptions,
  CodeDialogOptions,
  CodeToggleOptions,
  ColoredBadgeOptions,
  HoverCardOptions,
  LinkFormatOptions,
  MarkdownFormatOptions,
  TextFormatOptions,
} from '@/components/data-table/cells'

export enum ColumnFormat {
  BackgroundBar = 'background-bar',
  ColoredBadge = 'colored-badge',
  RelatedTime = 'related-time',
  NumberShort = 'number-short',
  CodeToggle = 'code-toggle',
  CodeDialog = 'code-dialog',
  HoverCard = 'hover-card',
  Duration = 'duration',
  Markdown = 'markdown',
  Boolean = 'boolean',
  Action = 'action',
  Number = 'number',
  Badge = 'badge',
  Code = 'code',
  Link = 'link',
  Text = 'text',
  None = 'none',
}

export type ColumnFormatWithArgs =
  | [ColumnFormat.Action, Action[]]
  | [ColumnFormat.Link, LinkFormatOptions]
  | [ColumnFormat.Text, TextFormatOptions]
  | [ColumnFormat.Markdown, MarkdownFormatOptions]
  | [ColumnFormat.ColoredBadge, ColoredBadgeOptions]
  | [ColumnFormat.HoverCard, HoverCardOptions]
  | [ColumnFormat.CodeDialog, CodeDialogOptions]
  | [ColumnFormat.CodeToggle, CodeToggleOptions]
  | [ColumnFormat.BackgroundBar, BackgroundBarOptions]

// Union of all possible format options
export type ColumnFormatOptions = ColumnFormatWithArgs[1]
