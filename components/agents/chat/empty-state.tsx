'use client'

import {
  ActivityIcon,
  ChevronRightIcon,
  ClockIcon,
  DatabaseIcon,
  HardDriveIcon,
  ServerIcon,
  SparklesIcon,
  TableIcon,
  UserIcon,
  ZapIcon,
} from 'lucide-react'

import type { ReactNode } from 'react'
import type { SuggestedPromptCategory } from '@/lib/ai/agent/suggested-prompts'

import { AgentInsightCards } from '@/components/agents/agent-insight-cards'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getSuggestedPrompts } from '@/lib/ai/agent/suggested-prompts'

const CATEGORY_ICONS: Record<SuggestedPromptCategory, ReactNode> = {
  Insights: <ZapIcon className="h-3.5 w-3.5" />,
  Performance: <ActivityIcon className="h-3.5 w-3.5" />,
  Storage: <HardDriveIcon className="h-3.5 w-3.5" />,
  Schema: <DatabaseIcon className="h-3.5 w-3.5" />,
  System: <ServerIcon className="h-3.5 w-3.5" />,
  Replication: <TableIcon className="h-3.5 w-3.5" />,
  Operations: <ClockIcon className="h-3.5 w-3.5" />,
  Access: <UserIcon className="h-3.5 w-3.5" />,
}

const GETTING_STARTED_FEATURES = [
  'Live metrics',
  'Read-only analysis',
  'One-click prompts',
] as const

interface AgentChatEmptyStateProps {
  readonly onSubmitPrompt: (prompt: string) => void
}

export function AgentChatEmptyState({
  onSubmitPrompt,
}: AgentChatEmptyStateProps) {
  const suggestions = getSuggestedPrompts({ limit: 8 })

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 sm:px-6">
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-background via-background to-muted/30">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-border/60 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Agent workspace
              </Badge>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card">
                  <SparklesIcon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
                    Inspect your ClickHouse cluster
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base [text-wrap:pretty]">
                    Start with a live health signal or launch one of the
                    ready-made prompts below. Every card and question sends
                    directly to the agent.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[320px]">
              {GETTING_STARTED_FEATURES.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-border/60 bg-background/70 px-2.5 py-2 text-xs font-medium text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Live cluster snapshot
            </h3>
            <p className="text-sm text-muted-foreground">
              These values are fetched from the current host and open the
              matching investigation when clicked.
            </p>
          </div>
        </div>
        <AgentInsightCards onQuestionClick={onSubmitPrompt} />
      </section>

      <Card className="border-border/60 bg-muted/10">
        <CardHeader className="space-y-2 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base tracking-tight sm:text-lg">
                Suggested questions
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6">
                Use a starter prompt for schemas, storage, query performance,
                and system health. You can keep iterating from there.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.text}
                onClick={() => onSubmitPrompt(suggestion.text)}
                className="group flex min-h-10 items-center gap-2.5 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-left transition-[transform,border-color,background-color] hover:border-border hover:bg-accent/20 active:scale-[0.96]"
              >
                <span className="shrink-0 text-muted-foreground">
                  {CATEGORY_ICONS[suggestion.category]}
                </span>
                <span className="min-w-0 flex-1 text-sm text-foreground">
                  {suggestion.text}
                </span>
                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
