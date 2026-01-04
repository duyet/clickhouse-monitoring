/**
 * Error alert icon configurations
 *
 * Maps error types to their corresponding icons for consistent visual representation.
 */

import {
  AlertTriangleIcon,
  DatabaseIcon,
  type LucideIcon,
  NetworkIcon,
  ShieldXIcon,
  XCircleIcon,
} from 'lucide-react'

import type { ReactElement } from 'react'

export type ErrorIconType =
  | 'table_not_found'
  | 'permission_error'
  | 'network_error'
  | 'validation_error'
  | 'query_error'
  | 'default'

const ICON_CLASS_NAME = 'text-muted-foreground h-5 w-5'

const ERROR_ICONS: Record<ErrorIconType, LucideIcon> = {
  table_not_found: DatabaseIcon,
  permission_error: ShieldXIcon,
  network_error: NetworkIcon,
  validation_error: AlertTriangleIcon,
  query_error: XCircleIcon,
  default: AlertTriangleIcon,
}

/**
 * Get the icon component for a given error type
 */
export function getErrorIcon(errorType?: ErrorIconType): ReactElement {
  const Icon = ERROR_ICONS[errorType || 'default']
  return <Icon className={ICON_CLASS_NAME} />
}
