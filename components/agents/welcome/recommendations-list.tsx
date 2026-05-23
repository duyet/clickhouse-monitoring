'use client'

/**
 * Recommendation prompts shown on the AI Agent welcome screen, replacing the
 * old skills capability grid. Each row pairs a short category tag with a
 * full-text prompt; clicking the row submits the prompt immediately.
 */

import { ArrowRightIcon } from 'lucide-react'

import { SUGGESTED_PROMPTS } from '@/components/agents/welcome/suggested-prompts'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  INSIGHTS:
    'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  SCHEMA: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  STORAGE:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  QUERIES:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  ERRORS: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  MERGES: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
  SYSTEM: 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
}

interface RecommendationsListProps {
  onPickPrompt?: (prompt: string) => void
  limit?: number
}

export function RecommendationsList({
  onPickPrompt,
  limit,
}: RecommendationsListProps) {
  const prompts =
    typeof limit === 'number' && limit > 0
      ? SUGGESTED_PROMPTS.slice(0, limit)
      : SUGGESTED_PROMPTS

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold tracking-tight">
          Suggested questions
        </h3>
        <p className="text-muted-foreground text-[11.5px]">
          Pick one to get started — or write your own.
        </p>
      </div>

      <div className="border-border divide-border divide-y rounded-lg border">
        {prompts.map((entry) => {
          const colorClass =
            CATEGORY_COLORS[entry.category] ?? 'bg-muted text-muted-foreground'
          return (
            <button
              key={entry.title}
              type="button"
              onClick={() => onPickPrompt?.(entry.prompt)}
              className="hover:bg-muted/40 group flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <span
                className={cn(
                  'mt-0.5 inline-flex shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold leading-none tracking-wider uppercase',
                  colorClass
                )}
              >
                {entry.category}
              </span>
              <span className="text-foreground/90 flex-1 text-[12.5px] leading-snug">
                {entry.prompt}
              </span>
              <ArrowRightIcon className="text-muted-foreground/60 group-hover:text-foreground mt-1 size-3 shrink-0" />
            </button>
          )
        })}
      </div>
    </section>
  )
}
