'use client'

import dedent from 'dedent'
import {
  AlertTriangleIcon,
  BugIcon,
  DatabaseIcon,
  NetworkIcon,
  NotebookPenIcon,
  RefreshCwIcon,
  ShieldXIcon,
  XCircleIcon,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getEnvironment, shouldShowDetailedErrors } from '@/lib/env-utils'

interface ErrorAlertProps {
  title?: string
  message?: string | React.ReactNode | React.ReactNode[]
  docs?: string | React.ReactNode | React.ReactNode[]
  query?: string
  reset?: () => void
  className?: string
  variant?: 'default' | 'destructive' | 'warning' | 'info'
  errorType?:
    | 'table_not_found'
    | 'permission_error'
    | 'network_error'
    | 'validation_error'
    | 'query_error'
  digest?: string
  stack?: string
  compact?: boolean
}

export function ErrorAlert({
  title = 'Something went wrong!',
  message = 'Checking console for more details.',
  docs,
  query,
  reset,
  className,
  variant = 'destructive',
  errorType,
  digest,
  stack,
  compact = false,
}: ErrorAlertProps) {
  const [countdown, setCountdown] = useState(30)
  const showDetails = shouldShowDetailedErrors()
  const environment = getEnvironment()

  // Extract just the first line for compact mode
  const compactMessage =
    compact && typeof message === 'string' ? message.split('\n')[0] : message

  useEffect(() => {
    if (!reset) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          reset()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [reset])

  const getErrorIcon = () => {
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

  const getVariantStyles = () => {
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

  const renderContent = (
    content: string | React.ReactNode | React.ReactNode[]
  ) => (
    <div className="text-muted-foreground text-sm leading-relaxed">
      {typeof content === 'string' ? <div>{content}</div> : content}
    </div>
  )

  const renderAccordion = (
    title: string,
    content: string | React.ReactNode
  ) => (
    <div className="mt-3">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem className="border-0" value="item-1">
          <AccordionTrigger
            className="px-0 py-2 text-sm hover:no-underline"
          >
            <div className="flex items-center gap-2">
              <DatabaseIcon className="h-4 w-4" />
              {title}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <div className="bg-muted/30 rounded p-2">
              <code className="text-muted-foreground text-xs">
                {typeof content === 'string' ? (
                  <pre className="whitespace-pre-wrap">{dedent(content)}</pre>
                ) : (
                  content
                )}
              </code>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )

  const renderDocs = (docs: string | React.ReactNode) => (
    <>
      {docs ? (
        <div className="mt-3 border-t pt-3">
          <div className="flex items-start gap-2">
            <NotebookPenIcon className="text-muted-foreground mt-0.5 h-4 w-4 flex-none" />
            <div className="text-muted-foreground text-sm">{docs}</div>
          </div>
        </div>
      ) : null}
    </>
  )

  return (
    <div
      className={cn('rounded-lg border', compact ? 'p-2' : 'p-4', className)}
      style={getVariantStyles() as React.CSSProperties}
      data-testid="error-message"
    >
      <div className="flex items-start gap-3">
        {!compact && getErrorIcon()}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div
              className={`text-foreground ${compact ? 'text-sm' : 'font-medium'}`}
            >
              {title}
            </div>
            {!compact && showDetails && (
              <Badge variant="outline" className="text-xs">
                {environment}
              </Badge>
            )}
          </div>
          {message && !compact && renderContent(compactMessage)}
          {message && compact && (
            <div className="text-muted-foreground text-xs">
              {typeof compactMessage === 'string'
                ? compactMessage.substring(0, 50) +
                  (compactMessage.length > 50 ? '...' : '')
                : compactMessage}
            </div>
          )}

          {/* Development: Show stack trace */}
          {!compact &&
            showDetails &&
            stack &&
            renderAccordion('Stack Trace', stack)}

          {/* Always show query if available */}
          {Boolean(query) && renderAccordion('View Query Details', query)}

          {/* Show documentation */}
          {!compact && Boolean(docs) && renderDocs(docs)}

          {/* Show error digest for tracking */}
          {!compact && digest && (
            <div className="mt-3 border-t pt-3">
              <div className="flex items-start gap-2">
                <BugIcon className="text-muted-foreground mt-0.5 h-4 w-4 flex-none" />
                <div className="text-muted-foreground text-xs">
                  <div className="font-medium">Error ID (for support):</div>
                  <code className="bg-muted/30 mt-1 block rounded px-2 py-1 font-mono">
                    {digest}
                  </code>
                </div>
              </div>
            </div>
          )}

          {!compact && reset && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => reset()}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Try again {countdown >= 0 && `(${countdown}s)`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
