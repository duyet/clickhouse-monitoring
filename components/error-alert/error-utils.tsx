'use client'

import {
  AlertTriangleIcon,
  DatabaseIcon,
  NetworkIcon,
  ShieldXIcon,
  XCircleIcon,
} from 'lucide-react'
import type React from 'react'

import type { ErrorAlertType, ErrorAlertVariant } from './types'

export function getErrorIcon(errorType?: ErrorAlertType): React.ReactNode {
  switch (errorType) {
    case 'table_not_found':
      return <DatabaseIcon className="text-muted-foreground h-5 w-5" />
    case 'permission_error':
      return <ShieldXIcon className="text-muted-foreground h-5 w-5" />
    case 'network_error':
      return <NetworkIcon className="text-muted-foreground h-5 w-5" />
    case 'validation_error':
      return <AlertTriangleIcon className="text-muted-foreground h-5 w-5" />
    case 'query_error':
      return <XCircleIcon className="text-muted-foreground h-5 w-5" />
    default:
      return <AlertTriangleIcon className="text-muted-foreground h-5 w-5" />
  }
}

export function getVariantStyles(variant: ErrorAlertVariant = 'default') {
  switch (variant) {
    case 'warning':
      return {
        borderColor: 'hsl(var(--alert-warning-border))',
        backgroundColor: 'hsl(var(--alert-warning-bg))',
        color: 'hsl(var(--alert-warning-text))',
      }
    case 'info':
      return {
        borderColor: 'hsl(var(--alert-info-border))',
        backgroundColor: 'hsl(var(--alert-info-bg))',
        color: 'hsl(var(--alert-info-text))',
      }
    case 'destructive':
      return {
        borderColor: 'hsl(var(--alert-destructive-border))',
        backgroundColor: 'hsl(var(--alert-destructive-bg))',
        color: 'hsl(var(--alert-destructive-text))',
      }
    default:
      return {
        borderColor: 'hsl(var(--border))',
        backgroundColor: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
      }
  }
}

export function truncateMessage(
  message: string | React.ReactNode,
  maxLength: number = 50
): string {
  if (typeof message !== 'string') return ''
  return message.substring(0, maxLength) + (message.length > maxLength ? '...' : '')
}

export function renderContent(
  content: string | React.ReactNode | React.ReactNode[]
) {
  return (
    <div className="text-muted-foreground text-sm leading-relaxed">
      {typeof content === 'string' ? <div>{content}</div> : content}
    </div>
  )
}
