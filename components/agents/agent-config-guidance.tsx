'use client'

import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ExternalLink,
  X,
} from 'lucide-react'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface AgentConfigGuidanceProps {
  /** Missing config keys (e.g., ["LLM_API_KEY", "LLM_API_BASE"]) */
  missingKeys?: string[]
  /** Optional custom className */
  className?: string
  /** Optional callback when alert is dismissed */
  onDismiss?: () => void
}

/**
 * AgentConfigGuidance Component
 *
 * Displays helpful configuration guidance when LLM config is missing.
 * Shows a warning card with a modal containing detailed setup instructions.
 *
 * Pattern based on OptionalTableInfo but uses amber/warning theme
 * to indicate configuration is required for functionality.
 *
 * @example
 * ```tsx
 * import { AgentConfigGuidance } from '@/components/agents/agent-config-guidance'
 * import { useLLMConfig } from '@/lib/hooks/use-llm-config'
 *
 * const { isConfigured, missingKeys } = useLLMConfig()
 * if (!isConfigured) {
 *   return <AgentConfigGuidance missingKeys={missingKeys} />
 * }
 * ```
 */
export function AgentConfigGuidance({
  missingKeys = [],
  className,
  onDismiss,
}: AgentConfigGuidanceProps) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)

  return (
    <Card
      className={cn(
        'rounded-md border-amber-200/50 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/20 shadow-none py-2',
        className
      )}
      role="alert"
      aria-label="Agent configuration required"
    >
      <CardContent className="p-4">
        <div className="flex gap-3 items-start">
          {/* Icon */}
          <div className="flex-shrink-0 pt-0.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground text-sm">
                Agent Configuration Required
              </h3>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  className="h-6 w-6 shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Summary - always visible */}
            <div className="text-sm text-muted-foreground mb-2">
              <p className="leading-relaxed">
                The AI agent requires LLM configuration to function.
              </p>

              {/* Missing keys badges */}
              {missingKeys.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {missingKeys.map((key) => (
                    <code
                      key={key}
                      className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800"
                    >
                      {key}
                    </code>
                  ))}
                </div>
              )}
            </div>

            {/* Collapsible details section */}
            {isDetailsExpanded && (
              <div className="text-sm text-muted-foreground space-y-2 mt-3 pt-3 border-t border-amber-200/30 dark:border-amber-800/30">
                <p className="text-xs leading-relaxed">
                  Configure the environment variables below, then restart your
                  server.
                </p>

                {/* Note about model selection */}
                <p className="text-xs text-muted-foreground">
                  💡 You can select the AI model using the dropdown in the
                  sidebar.
                </p>

                {/* Environment variables */}
                <div className="space-y-2 text-xs">
                  <div>
                    <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300">
                      LLM_API_KEY
                    </code>
                    <p className="text-muted-foreground mt-1">
                      Get your key from{' '}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        openrouter.ai/keys
                      </a>
                    </p>
                  </div>

                  <div>
                    <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300">
                      LLM_API_BASE
                    </code>
                    <pre className="text-xs bg-muted px-2 py-1 rounded mt-1">
                      https://openrouter.ai/api/v1
                    </pre>
                  </div>
                </div>

                {/* Example configuration */}
                <div>
                  <p className="text-xs font-medium mb-1">
                    Example .env.local:
                  </p>
                  <pre className="bg-slate-900 dark:bg-slate-950 text-slate-50 rounded-md p-2 text-xs overflow-x-auto border border-slate-700 dark:border-slate-800">
                    <code className="font-mono">{`LLM_API_KEY=sk-or-your-key-here
LLM_API_BASE=https://openrouter.ai/api/v1`}</code>
                  </pre>
                </div>

                {/* Documentation link */}
                <a
                  href="https://openrouter.ai/docs/quick-start"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  OpenRouter Quick Start Guide
                </a>
              </div>
            )}

            {/* Toggle button */}
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 mt-2 flex items-center gap-1"
            >
              {isDetailsExpanded ? (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Hide details
                </>
              ) : (
                <>
                  <BookOpen className="h-3 w-3" />
                  View setup instructions
                </>
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
