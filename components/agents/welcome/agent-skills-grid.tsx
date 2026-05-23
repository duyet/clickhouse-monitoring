'use client'

/**
 * 2-column grid of skill capability cards shown under the composer on the
 * AI Agent welcome screen. Each card surfaces a skill bundle (system or
 * community) and exposes a toggle that wires into `useAgentSkills` —
 * disabling a skill prunes its tools from the agent's surface area.
 */

import { ArrowRightIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useAgentSkills } from '@/lib/hooks/use-agent-skills'
import { cn } from '@/lib/utils'

interface AgentSkillsGridProps {
  onOpenLibrary?: () => void
}

export function AgentSkillsGrid({ onOpenLibrary }: AgentSkillsGridProps) {
  const { skills, isSkillEnabled, toggleSkill } = useAgentSkills()

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-semibold tracking-tight">Skills</h3>
          <p className="text-muted-foreground text-[11.5px]">
            Capabilities your agent can use. Toggle on to include in context.
          </p>
        </div>
        {onOpenLibrary ? (
          <button
            type="button"
            onClick={onOpenLibrary}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px]"
          >
            Skill library <ArrowRightIcon className="size-2.5" />
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {skills.map((skill) => {
          const Icon = skill.icon
          const on = isSkillEnabled(skill.id)
          return (
            <div
              key={skill.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-all',
                on
                  ? 'border-border bg-card'
                  : 'border-border/60 border-dashed bg-transparent'
              )}
            >
              <div
                className={cn(
                  'inline-flex size-9 shrink-0 items-center justify-center rounded-md',
                  on
                    ? 'bg-muted text-foreground'
                    : 'bg-muted/40 text-muted-foreground'
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.7} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12.5px] font-medium">
                    {skill.name}
                  </span>
                  <Badge
                    variant={skill.source === 'system' ? 'default' : 'outline'}
                    className={cn(
                      'h-4 px-1.5 text-[10px] font-normal',
                      skill.source === 'system'
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300'
                        : 'text-muted-foreground'
                    )}
                  >
                    {skill.source}
                  </Badge>
                  <span className="text-muted-foreground ml-auto font-mono text-[10px] tabular-nums">
                    {skill.tools.length} tools
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-[11.5px] leading-snug">
                  {skill.description}
                </p>
              </div>
              <Switch
                checked={on}
                onCheckedChange={() => toggleSkill(skill.id)}
                className="mt-0.5 shrink-0"
                aria-label={`Toggle ${skill.name} skill`}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
