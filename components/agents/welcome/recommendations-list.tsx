'use client'

/**
 * Recommendation prompts shown on the AI Agent welcome screen, replacing the
 * old skills capability grid. Each row pairs a short category tag with a
 * full-text prompt; clicking the row injects the prompt into the composer so
 * the user can hit send (or edit it first).
 */

import { ArrowRightIcon } from 'lucide-react'

import { SUGGESTED_PROMPTS } from '@/components/agents/welcome/suggested-prompts'

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
          Pick one to seed the composer — or write your own.
        </p>
      </div>

      <div className="border-border divide-border divide-y rounded-lg border">
        {prompts.map((entry) => (
          <button
            key={entry.title}
            type="button"
            onClick={() => onPickPrompt?.(entry.prompt)}
            className="hover:bg-muted/40 group flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
          >
            <span className="text-muted-foreground mt-0.5 w-16 shrink-0 text-[9.5px] font-semibold tracking-wider uppercase">
              {entry.category}
            </span>
            <span className="text-foreground/90 flex-1 text-[12.5px] leading-snug">
              {entry.prompt}
            </span>
            <ArrowRightIcon className="text-muted-foreground/60 group-hover:text-foreground mt-1 size-3 shrink-0" />
          </button>
        ))}
      </div>
    </section>
  )
}
