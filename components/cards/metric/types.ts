// ============================================================================
// Types
// ============================================================================

export type MetricTheme =
  | 'default'
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'pink'
  | 'cyan'
  | 'indigo'

export type MetricVariant =
  | 'default' // Custom render via children
  | 'single' // Single large value with optional unit
  | 'dual' // Two stacked values with units
  | 'list' // Key-value rows
  | 'subtitle' // Value with subtitle text
  | 'trend' // Value with trend indicator
  | 'oversized' // Extra large muted number display
  | 'split' // Two side-by-side numbers with vertical divider
  | 'pulse' // Animated card with glow effects and sparkline

export interface MetricListItem {
  label: string
  value: string | number
  format?: 'text' | 'mono' | 'truncate'
}

export interface MetricCardProps<TData = unknown> {
  /** SWR-like response from useChartData hook */
  swr: {
    data?: TData[] | TData | Record<string, unknown> | unknown
    error?: Error | null
    isLoading?: boolean
    mutate?: () => void
    refresh?: () => void
    sql?: string
  }
  /** Card title */
  title: string
  /** Card description (subtitle) */
  description?: string
  /** Link href for "View all" action */
  viewAllHref?: string
  /** Link label (default: "View all") */
  viewAllLabel?: string
  /** Visual theme for the card */
  theme?: MetricTheme
  /** Icon to display */
  icon?: React.ReactNode
  /** Container className */
  className?: string

  /** Display variant */
  variant?: MetricVariant
  /** Compact mode for tighter spacing */
  compact?: boolean

  /** For 'single' variant: the value to display */
  value?: string | number | ((data: TData[]) => string | number)
  /** For 'single' variant: unit label (e.g., "queries") */
  unit?: string

  /** For 'dual' variant: first value */
  value1?: string | number | ((data: TData[]) => string | number)
  /** For 'dual' variant: first unit label */
  unit1?: string
  /** For 'dual' variant: second value */
  value2?: string | number | ((data: TData[]) => string | number)
  /** For 'dual' variant: second unit label */
  unit2?: string

  /** For 'split' variant: first label (e.g., "Databases") */
  label1?: string
  /** For 'split' variant: second label (e.g., "Tables") */
  label2?: string

  /** For 'list' variant: array of label-value pairs */
  items?: MetricListItem[] | ((data: TData[]) => MetricListItem[])

  /** For 'subtitle' variant: subtitle text */
  subtitle?: string | ((data: TData[]) => string)

  /** For 'trend' variant: trend value (positive/negative for up/down) */
  trend?: number | ((data: TData[]) => number)
  /** For 'trend' variant: trend label */
  trendLabel?: string | ((data: TData[]) => string)

  /** For 'pulse' variant: historical data for sparkline */
  history?: number[]
  /** For 'pulse' variant: label for sparkline */
  historyLabel?: string
  /** For 'pulse' variant: show sparkline chart */
  showSparkline?: boolean

  /** Custom render function (only used with variant='default') */
  children?: (data: TData[]) => React.ReactNode
}

export interface ThemeConfig {
  gradient: string
  iconColor: string
  textColor: string
  bgColor: string
}

export interface MetricCardSkeletonProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  theme?: MetricTheme
  variant?: MetricVariant
  compact?: boolean
  className?: string
}
