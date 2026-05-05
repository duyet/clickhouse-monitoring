'use client'

import {
  AlertCircle,
  BotMessageSquare,
  ChevronDown,
  Copy,
  ExternalLink,
  Info,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

import { memo, useState } from 'react'
import { chartCard } from '@/components/charts/chart-card-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import {
  type CardError,
  detectCardErrorVariant,
  getCardErrorClassName,
  getCardErrorDescription,
  getCardErrorTitle,
  getTableMissingInfo,
  shouldShowRetryButton,
} from '@/lib/card-error-utils'
import { cn } from '@/lib/utils'

interface ChartErrorProps {
  error: CardError
  title?: string
  className?: string
  onRetry?: () => void
  /** Use compact layout for smaller charts */
  compact?: boolean
  /** Enable AI assistance features */
  enableAI?: boolean
}

export const ChartError = memo(function ChartError({
  error,
  title: customTitle,
  className,
  onRetry,
  compact = false,
  enableAI = true,
}: ChartErrorProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const variant = detectCardErrorVariant(error)
  const title = getCardErrorTitle(variant, customTitle)
  const description = getCardErrorDescription(error, variant, compact)
  const errorClassName = getCardErrorClassName(variant)
  const showRetry = onRetry && shouldShowRetryButton(error)

  const tableMissingInfo = getTableMissingInfo(error)
  const hasTableGuidance = tableMissingInfo?.guidance

  // Generate markdown for AI prompts
  const errorMarkdown = `# ${customTitle || 'ClickHouse Error'}

**Error:** ${error?.message || 'Unknown'}

${
  error instanceof Error && error.stack
    ? `**Stack:**
\`\`\`
${error.stack}
\`\`\`
`
    : ''
}`

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(errorMarkdown)
      toast.success('Error details copied to clipboard')
    } catch {
      toast.error('Failed to copy error')
    }
  }

  const handleAskAI = async () => {
    const prompt = `Please analyze this ClickHouse monitoring error and provide a fix:\n\n${errorMarkdown}`
    try {
      await navigator.clipboard.writeText(prompt)
      toast.info('Prompt copied! Paste into your AI agent (Claude, etc.)')
    } catch {
      toast.error('Failed to copy prompt')
    }
  }

  return (
    <Card
      className={cn(
        chartCard.base,
        chartCard.variants.error,
        errorClassName,
        className
      )}
      role="alert"
      aria-label={title ? `${title} error` : 'Error loading chart'}
    >
      <CardContent className={chartCard.contentError}>
        <EmptyState
          variant={variant}
          title={title}
          description={description}
          compact={compact}
          action={
            showRetry
              ? {
                  label: 'Retry',
                  onClick: onRetry,
                  icon: <RefreshCw className="mr-1.5 h-3.5 w-3.5" />,
                }
              : undefined
          }
        />

        {/* Simple error line with details button */}
        {!compact && (
          <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-muted/50">
            <span className="text-xs text-muted-foreground truncate flex-1">
              {error.message}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailsOpen(true)}
              className="h-7 px-2 text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              Details
            </Button>
          </div>
        )}

        {/* Error details dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {title}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Error message */}
              <div>
                <h4 className="text-sm font-medium mb-2">Error Message</h4>
                <pre className="p-3 bg-muted/30 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all">
                  {error.message}
                  {(() => {
                    const details = (
                      error as {
                        details?: {
                          originalError?: Error
                          httpStatusCode?: number
                          host?: string
                        }
                      }
                    ).details

                    // Show additional details if available
                    if (!details) return null

                    const parts: string[] = []

                    if (details.httpStatusCode) {
                      parts.push(`Status Code: ${details.httpStatusCode}`)
                    }

                    if (details.originalError instanceof Error) {
                      if (details.originalError.message !== error.message) {
                        parts.push(
                          `Caused by: ${details.originalError.message}`
                        )
                      }
                      if (details.originalError.stack) {
                        parts.push(`Stack: ${details.originalError.stack}`)
                      }
                    }

                    return parts.length > 0 ? (
                      <span className="text-muted-foreground/70 mt-2 block">
                        {parts.join('\n')}
                      </span>
                    ) : null
                  })()}
                </pre>
              </div>

              {/* Action buttons */}
              {enableAI && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyError}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy error as markdown
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAskAI}
                    className="text-xs"
                  >
                    <BotMessageSquare className="h-3 w-3 mr-1" />
                    Ask AI to fix
                  </Button>
                </div>
              )}

              {/* Table guidance */}
              {hasTableGuidance && (
                <div className="pt-3 border-t border-muted/50">
                  <h4 className="text-sm font-medium mb-2">Table Guidance</h4>
                  <div className="text-xs space-y-2">
                    <p className="text-muted-foreground">
                      {tableMissingInfo.guidance?.description ||
                        'Enable this system log in your ClickHouse config'}
                    </p>
                    {tableMissingInfo.guidance?.docsUrl && (
                      <a
                        href={tableMissingInfo.guidance.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View ClickHouse docs
                      </a>
                    )}
                    {tableMissingInfo.guidance?.enableInstructions && (
                      <div className="p-3 bg-muted/20 rounded-md">
                        <p className="font-medium mb-1">How to fix:</p>
                        <pre className="text-[11px] whitespace-pre-wrap">
                          {tableMissingInfo.guidance.enableInstructions}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
})
