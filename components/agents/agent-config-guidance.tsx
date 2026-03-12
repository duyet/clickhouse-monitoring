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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Card
        className={cn(
          'rounded-md border-amber-200/50 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/20 shadow-none py-2',
          className
        )}
        role="alert"
        aria-label="Agent configuration required"
      >
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-foreground">
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

              <div className="text-sm text-muted-foreground space-y-3">
                <p className="leading-relaxed">
                  The AI agent requires LLM configuration to function. Configure
                  the following environment variables:
                </p>

                {/* Missing keys badges */}
                {missingKeys.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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

                {/* Note about model selection */}
                <p className="text-xs text-muted-foreground">
                  💡 You can select the AI model using the dropdown in the
                  sidebar.
                </p>

                {/* View instructions button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    className="h-8 text-xs"
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                    View Setup Instructions
                    <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup instructions modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agent LLM Configuration</DialogTitle>
            <DialogDescription>
              Set up environment variables for the AI agent functionality
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Required environment variables */}
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Required Environment Variables
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                    LLM_API_KEY
                  </code>
                  <p className="text-muted-foreground mt-1">
                    Your API key for the LLM provider. For OpenRouter, get your
                    key from{' '}
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
                  <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                    LLM_API_BASE
                  </code>
                  <p className="text-muted-foreground mt-1">
                    The API base URL. For OpenRouter use:
                  </p>
                  <code className="text-xs block mt-1 bg-muted px-2 py-1 rounded">
                    https://openrouter.ai/api/v1
                  </code>
                </div>
              </div>
            </div>

            {/* Model selection note */}
            <div className="rounded-md border border-blue-200/50 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/20 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Model Selection:</strong> You can select which AI model
                to use from the dropdown in the sidebar. Free models are
                available including Gemma 3, Llama 3, and more.
              </p>
            </div>

            {/* Example environment configuration */}
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Example Environment Configuration
              </h4>
              <pre className="bg-slate-900 dark:bg-slate-950 text-slate-50 rounded-md p-3 text-xs overflow-x-auto border border-slate-700 dark:border-slate-800">
                <code className="font-mono">{`# AI Agent LLM Configuration
LLM_API_KEY=sk-or-your-key-here
LLM_API_BASE=https://openrouter.ai/api/v1`}</code>
              </pre>
            </div>

            {/* Documentation links */}
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Learn more about OpenRouter:
              </p>
              <a
                href="https://openrouter.ai/docs/quick-start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                OpenRouter Quick Start Guide
              </a>
            </div>

            {/* Restart reminder */}
            <div className="rounded-md border border-blue-200/50 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/20 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> After configuring these variables,
                restart your server for the changes to take effect.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
