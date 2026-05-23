'use client'

/**
 * Tool/skills toolbar that sits below the AI Agent composer.
 *
 * Shows the active model, skill count and tool count — each opening a
 * popover with the relevant management UI:
 *
 * - Skills popover: flat list of skill bundles with a per-skill toggle; the
 *   row itself opens a detail dialog so users can read about what each skill
 *   covers before enabling/disabling.
 * - Tools popover: flat list of individual MCP tools with a per-tool toggle,
 *   no longer grouped by skill.
 *
 * The send button itself stays inside the composer (the assistant-ui
 * `PromptInputTextareaWithMentions` already owns submission); this toolbar
 * is a sibling that lives in the same outer card.
 */

import {
  ChevronDownIcon,
  HashIcon,
  SparklesIcon,
  WrenchIcon,
} from 'lucide-react'

import { useMemo, useState } from 'react'
import { AgentModelPicker } from '@/components/agents/welcome/agent-model-picker'
import { SkillDetailDialog } from '@/components/agents/welcome/skill-detail-dialog'
import {
  getAllSkillTools,
  getSkillsForTool,
  type Skill,
} from '@/components/agents/welcome/skills-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { useAgentSkills } from '@/lib/hooks/use-agent-skills'
import { useToolConfig } from '@/lib/hooks/use-tool-config'
import { cn } from '@/lib/utils'

interface ComposerToolbarProps {
  /** Number of "context" chips the user has attached (queries, tables, …). */
  contextCount?: number
  onAddContext?: () => void
  className?: string
}

export function ComposerToolbar({
  contextCount = 0,
  onAddContext,
  className,
}: ComposerToolbarProps) {
  const {
    skills,
    isSkillEnabled,
    toggleSkill,
    activeSkillCount,
    totalSkillCount,
  } = useAgentSkills()
  const { isToolEnabled, toggleTool } = useToolConfig()

  const [skillsOpen, setSkillsOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [skillDetail, setSkillDetail] = useState<Skill | null>(null)

  const allTools = useMemo(() => getAllSkillTools(), [])
  const enabledToolCount = useMemo(
    () => allTools.filter((t) => isToolEnabled(t)).length,
    [allTools, isToolEnabled]
  )

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1 px-1 py-1', className)}
    >
      <AgentModelPicker variant="toolbar" />

      {/* Skills popover */}
      <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-[11.5px]"
          >
            <SparklesIcon className="size-3" />
            <span>
              <span className="text-foreground font-medium tabular-nums">
                {activeSkillCount}
              </span>
              <span className="tabular-nums">/{totalSkillCount}</span> skills
            </span>
            <ChevronDownIcon className="size-2.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={4} className="w-[340px] p-1">
          <div className="text-muted-foreground px-2 py-1.5 text-[10px] font-semibold tracking-wider uppercase">
            Skills
          </div>
          <ScrollArea className="max-h-96">
            <div className="space-y-0.5">
              {skills.map((skill) => {
                const Icon = skill.icon
                const on = isSkillEnabled(skill.id)
                return (
                  <div
                    key={skill.id}
                    className="hover:bg-muted/40 flex items-center gap-2 rounded-md py-1.5 pr-2 pl-1"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSkillsOpen(false)
                        setSkillDetail(skill)
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 text-left"
                    >
                      <div className="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md">
                        <Icon className="size-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] font-medium">
                            {skill.name}
                          </span>
                          <Badge
                            variant={
                              skill.source === 'system' ? 'default' : 'outline'
                            }
                            className={cn(
                              'h-4 px-1.5 text-[10px] font-normal',
                              skill.source === 'system'
                                ? 'bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300'
                                : 'text-muted-foreground'
                            )}
                          >
                            {skill.source}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground truncate text-[10.5px]">
                          {skill.description}
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
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Tools popover — flat list, per-tool toggle */}
      <Popover open={toolsOpen} onOpenChange={setToolsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-[11.5px]"
          >
            <WrenchIcon className="size-3" />
            <span>
              <span className="text-foreground font-medium tabular-nums">
                {enabledToolCount}
              </span>
              <span className="tabular-nums">/{allTools.length}</span> tools
            </span>
            <ChevronDownIcon className="size-2.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={4} className="w-[320px] p-1">
          <div className="text-muted-foreground flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold tracking-wider uppercase">
            <span>Tools</span>
            <span className="text-muted-foreground/70 font-normal normal-case tabular-nums">
              {enabledToolCount} active
            </span>
          </div>
          <ScrollArea className="max-h-96">
            <div className="space-y-0.5">
              {allTools.map((tool) => {
                const on = isToolEnabled(tool)
                const owners = getSkillsForTool(tool)
                return (
                  <div
                    key={tool}
                    className="hover:bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5"
                  >
                    <span
                      className={cn(
                        'inline-block size-1.5 shrink-0 rounded-full',
                        on ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[11.5px]">
                        {tool}
                      </div>
                      {owners.length > 0 ? (
                        <div className="text-muted-foreground truncate text-[10px]">
                          {owners.map((o) => o.name).join(' · ')}
                        </div>
                      ) : null}
                    </div>
                    <Switch
                      checked={on}
                      onCheckedChange={() => toggleTool(tool)}
                      className="shrink-0"
                      aria-label={`Toggle ${tool}`}
                    />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Add context */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onAddContext}
        className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-[11.5px]"
      >
        <HashIcon className="size-3" />
        <span>
          Add context
          {contextCount > 0 ? (
            <span className="text-foreground ml-1 font-medium tabular-nums">
              ({contextCount})
            </span>
          ) : null}
        </span>
      </Button>

      <SkillDetailDialog
        skill={skillDetail}
        open={skillDetail !== null}
        onOpenChange={(open) => {
          if (!open) setSkillDetail(null)
        }}
        isEnabled={skillDetail ? isSkillEnabled(skillDetail.id) : false}
        onToggle={(id) => toggleSkill(id)}
      />
    </div>
  )
}
