'use client'

import {
  AlertCircle,
  BotMessageSquare,
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
import { ScrollArea } from '@/components/ui/scroll-area'
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
  /** The failed ClickHouse SQL query (if available) */
  sql?: string
}

export const ChartError = memo(function ChartError({
  error,
  title: customTitle,
  className,
  onRetry,
  compact = false,
  enableAI = true,
  sql,
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
  sql
    ? `**Failed SQL Query:**
\`\`\`sql
${sql}
\`\`\`
`
    : ''
}
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
        'transition-all duration-300 hover:shadow-md hover:border-destructive/40',
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
                  icon: (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin-slow" />
                  ),
                }
              : undefined
          }
        />

        {/* Simple error line with details button */}
        {!compact && (
          <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-muted/50">
            <span className="text-xs text-muted-foreground truncate flex-1 font-mono max-w-[80%]">
              {error.message}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsOpen(true)}
              className="h-7 px-2.5 text-xs rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
            >
              <Info className="h-3 w-3 mr-1 shrink-0" />
              Diagnostics
            </Button>
          </div>
        )}

        {/* Error details dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-xl border border-border/80 shadow-2xl backdrop-blur-xl">
            <DialogHeader className="shrink-0 pb-2">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-destructive dark:text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground/90 mt-1">
                {description}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0 pr-2">
              <div className="space-y-5 pb-4">
                {/* Failed ClickHouse SQL Query */}
                {sql && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Failed ClickHouse Query
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2.5 hover:bg-muted/80 rounded-md gap-1"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(sql)
                            toast.success('SQL query copied to clipboard')
                          } catch {
                            toast.error('Failed to copy SQL')
                          }
                        }}
                      >
                        <Copy className="h-3 w-3" />
                        Copy SQL
                      </Button>
                    </div>
                    <pre className="p-3.5 bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-100 overflow-x-auto whitespace-pre leading-relaxed select-all">
                      {sql}
                    </pre>
                  </div>
                )}

                {/* Error message / Traceback */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Diagnostics & Traceback
                  </h4>
                  <pre className="p-3.5 bg-muted/40 dark:bg-muted/10 border border-border/60 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed text-foreground/90">
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

                      if (!details) return null

                      const parts: string[] = []

                      if (details.httpStatusCode) {
                        parts.push(
                          `HTTP Status Code: ${details.httpStatusCode}`
                        )
                      }

                      if (details.originalError instanceof Error) {
                        if (details.originalError.message !== error.message) {
                          parts.push(
                            `Caused by: ${details.originalError.message}`
                          )
                        }
                        if (details.originalError.stack) {
                          parts.push(
                            `Stack Trace:\n${details.originalError.stack}`
                          )
                        }
                      }

                      return parts.length > 0 ? (
                        <span className="text-muted-foreground/80 mt-3.5 pt-3.5 border-t border-border/40 block">
                          {parts.join('\n\n')}
                        </span>
                      ) : null
                    })()}
                  </pre>
                </div>

                {/* Table guidance */}
                {hasTableGuidance && (
                  <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Table Configuration Guidance
                    </h4>
                    <div className="text-xs space-y-2.5">
                      <p className="text-muted-foreground/95 leading-relaxed">
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
                        <div className="p-3 bg-muted/40 dark:bg-zinc-900 rounded-md border border-border/50">
                          <p className="font-semibold mb-1">How to enable:</p>
                          <pre className="text-[11px] font-mono whitespace-pre-wrap text-foreground/90">
                            {tableMissingInfo.guidance.enableInstructions}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* AI Diagnostics actions footer */}
            {enableAI && (
              <div className="shrink-0 flex flex-wrap gap-2 pt-4 border-t border-border/60 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyError}
                  className="text-xs h-8 gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Diagnostics MD
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAskAI}
                  className="text-xs h-8 gap-1.5"
                >
                  <BotMessageSquare className="h-3.5 w-3.5" />
                  Ask AI to fix
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
})
