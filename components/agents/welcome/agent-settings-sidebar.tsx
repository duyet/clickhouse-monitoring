'use client'

/**
 * Right-hand "Agent settings" sidebar for the AI Agent page.
 *
 * Five stacked sections — Host · Model · MCP Server · Skills · Suggested
 * prompts — that mirror the chrome of competing agent UIs (Codex, Replit
 * Agent etc.). The sidebar is collapsible; when closed the parent surfaces
 * a "Agent settings" affordance so it can be reopened.
 */

import {
  ArrowRightIcon,
  MonitorIcon,
  PanelRightCloseIcon,
  SparklesIcon,
  WrenchIcon,
} from 'lucide-react'

import type { Skill } from '@/components/agents/welcome/skills-data'

import { useState } from 'react'
import { AgentModelPicker } from '@/components/agents/welcome/agent-model-picker'
import { SkillDetailDialog } from '@/components/agents/welcome/skill-detail-dialog'
import { SUGGESTED_PROMPTS } from '@/components/agents/welcome/suggested-prompts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useAgentSkills } from '@/lib/hooks/use-agent-skills'
import { cn } from '@/lib/utils'

interface AgentSettingsSidebarProps {
  open: boolean
  onClose: () => void
  hostName: string
  onPickPrompt?: (prompt: string) => void
  onOpenSkillsLibrary?: () => void
}

export function AgentSettingsSidebar({
  open,
  onClose,
  hostName,
  onPickPrompt,
  onOpenSkillsLibrary,
}: AgentSettingsSidebarProps) {
  const {
    skills,
    isSkillEnabled,
    toggleSkill,
    activeSkillCount,
    totalSkillCount,
  } = useAgentSkills()
  const topSkills = skills.slice(0, 3)
  const [skillDetail, setSkillDetail] = useState<Skill | null>(null)

  return (
    <aside
      className={cn(
        'bg-card border-border shrink-0 overflow-y-auto border-l transition-all duration-200',
        open ? 'w-[320px] opacity-100' : 'pointer-events-none w-0 opacity-0'
      )}
      style={{ maxHeight: 'calc(100dvh - 6rem)' }}
    >
      <div className="w-[320px] p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-[14px] font-semibold whitespace-nowrap">
            Agent settings
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground size-7 shrink-0"
            aria-label="Close agent settings"
          >
            <PanelRightCloseIcon className="size-3.5" />
          </Button>
        </div>
        <p className="text-muted-foreground mb-4 text-[11.5px]">
          Host, model, tools, and skills.
        </p>

        {/* HOST */}
        <SidebarSection label="Host">
          <div className="bg-background border-input flex h-9 items-center gap-2 rounded-md border px-3">
            <MonitorIcon className="text-muted-foreground size-3.5" />
            <span className="font-mono text-[12.5px]">{hostName}</span>
          </div>
        </SidebarSection>

        {/* MODEL */}
        <SidebarSection label="Model">
          <AgentModelPicker variant="panel" />
        </SidebarSection>

        {/* MCP SERVER */}
        <SidebarSection
          label="MCP Server"
          right={
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          }
        >
          <div className="border-border rounded-md border p-2.5">
            <div className="flex items-center gap-2">
              <div className="bg-muted inline-flex size-7 items-center justify-center rounded-md">
                <WrenchIcon className="text-foreground size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[12.5px]">
                  clickhouse-monitor
                </div>
                <div className="text-muted-foreground text-[10.5px] tabular-nums">
                  14 tools · 2 resources
                </div>
              </div>
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                v1.0.0
              </Badge>
            </div>
          </div>
        </SidebarSection>

        {/* SKILLS */}
        <SidebarSection
          label="Skills"
          right={
            <span className="text-muted-foreground text-[10px] tabular-nums">
              <span className="text-foreground font-medium">
                {activeSkillCount}
              </span>
              /{totalSkillCount} on
            </span>
          }
        >
          <div className="border-border divide-border divide-y rounded-md border">
            {topSkills.map((skill) => {
              const Icon = skill.icon
              const on = isSkillEnabled(skill.id)
              return (
                <div
                  key={skill.id}
                  className="flex items-center gap-2 py-2 pr-3 pl-2"
                >
                  <button
                    type="button"
                    onClick={() => setSkillDetail(skill)}
                    className="hover:bg-muted/40 flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 text-left"
                  >
                    <div className="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md">
                      <Icon className="size-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium">
                        {skill.name}
                      </div>
                      <div className="text-muted-foreground text-[10px] tabular-nums">
                        {skill.tools.length} tools · {skill.source}
                      </div>
                    </div>
                  </button>
                  <Switch
                    checked={on}
                    onCheckedChange={() => toggleSkill(skill.id)}
                    className="shrink-0"
                    aria-label={`Toggle ${skill.name}`}
                  />
                </div>
              )
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSkillsLibrary}
            className="mt-1.5 h-8 w-full justify-center gap-1.5 text-[11.5px]"
          >
            <SparklesIcon className="size-3" />
            Skill library
            <span className="text-muted-foreground tabular-nums">
              ({totalSkillCount})
            </span>
            <ArrowRightIcon className="text-muted-foreground size-2.5" />
          </Button>
        </SidebarSection>

        {/* SUGGESTED PROMPTS */}
        <SidebarSection
          label="Suggested prompts"
          right={
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-[10.5px]"
            >
              Show more
            </button>
          }
        >
          <div className="space-y-1.5 text-[11.5px]">
            {SUGGESTED_PROMPTS.slice(0, 3).map((entry) => (
              <button
                key={entry.title}
                type="button"
                onClick={() => onPickPrompt?.(entry.prompt)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/40 -mx-1 flex w-[calc(100%+0.5rem)] items-start gap-1.5 rounded px-1 py-0.5 text-left transition-colors"
              >
                <span className="text-foreground w-14 shrink-0 pt-0.5 text-[9.5px] font-semibold tracking-wider uppercase">
                  {entry.category}
                </span>
                <span className="line-clamp-2 leading-snug">
                  {entry.prompt}
                </span>
              </button>
            ))}
          </div>
        </SidebarSection>

        <SkillDetailDialog
          skill={skillDetail}
          open={skillDetail !== null}
          onOpenChange={(next) => {
            if (!next) setSkillDetail(null)
          }}
          isEnabled={skillDetail ? isSkillEnabled(skillDetail.id) : false}
          onToggle={(id) => toggleSkill(id)}
        />
      </div>
    </aside>
  )
}

function SidebarSection({
  label,
  right,
  children,
}: {
  label: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-muted-foreground text-[10.5px] font-semibold tracking-wider uppercase">
          {label}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}
