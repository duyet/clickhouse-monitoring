'use client'

import {
  ActivityIcon,
  BarChart3Icon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CoinsIcon,
  DatabaseIcon,
  HelpCircleIcon,
  MonitorIcon,
  PanelRightClose,
  RefreshCwIcon,
  ZapIcon,
} from 'lucide-react'

import type { UIMessage } from 'ai'
import type { ReactNode } from 'react'
import type {
  McpResource,
  McpToolCategory,
} from '@/components/mcp/mcp-tools-data'
import type { ApiMcpTool } from '@/lib/swr/use-mcp-server-info'

import { useMemo, useState } from 'react'
import { SkillsTreeDialog } from '@/components/agents/skills-tree-dialog'
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorSeparator,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector'
import { MCP_TOOL_CATEGORIES } from '@/components/mcp/mcp-tools-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent as UIDialogContent,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  getSkillsMetadata,
  loadSkillContent,
} from '@/lib/ai/agent/skills/registry'
import { getSuggestedPrompts } from '@/lib/ai/agent/suggested-prompts'
import { useAgentModel } from '@/lib/hooks/use-agent-model'
import { useAgentSessionStats } from '@/lib/hooks/use-agent-session-stats'
import { useToolConfig } from '@/lib/hooks/use-tool-config'
import { useMcpServerInfo } from '@/lib/swr'
import { useHosts } from '@/lib/swr/use-hosts'
import { cn } from '@/lib/utils'

interface AgentsSidebarProps {
  hostId: number
  messages?: readonly UIMessage[]
  onSubmitPrompt?: (prompt: string) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const MODEL_PROVIDER_BADGE_CLASS =
  'shrink-0 rounded-full border-border/60 bg-muted/60 px-1.5 py-0 font-mono text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground'

function SidebarSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border-border/35 border-b last:border-b-0">
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5 truncate text-[13px] font-semibold tracking-tight text-foreground">
          {title}
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircleIcon className="h-3.5 w-3.5 shrink-0 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px] text-xs">
                {description}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {action}
      </div>
      <div className="px-2 pb-2">{children}</div>
    </section>
  )
}

function TreeTriggerIcon({ open }: { open: boolean }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
      {open ? (
        <ChevronDownIcon className="h-3 w-3" />
      ) : (
        <ChevronRightIcon className="h-3 w-3" />
      )}
    </span>
  )
}

function HostSelector({ hostId }: { readonly hostId: number }) {
  const { hosts } = useHosts()
  const current = hosts[hostId]
  const label = current?.name || `Host ${hostId}`

  return (
    <SidebarSection
      title="Host"
      description="Switch hosts from the page header."
    >
      <div className="flex h-8 items-center gap-2 rounded-md border border-border/60 bg-background/70 px-2 text-xs shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
        <MonitorIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-foreground tabular-nums">{label}</span>
      </div>
    </SidebarSection>
  )
}

function getProviderFromModelId(modelId: string): string {
  // New format: `provider:model` — extract provider prefix
  const idx = modelId.indexOf(':')
  if (idx !== -1) {
    const provider = modelId.slice(0, idx)
    if (
      provider === 'openrouter' ||
      provider === 'nvidia' ||
      provider === 'anyrouter'
    )
      return provider
  }
  // Legacy: detect from model name prefix
  if (modelId.startsWith('openrouter/')) return 'openrouter'
  if (modelId.startsWith('nvidia/')) return 'nvidia'
  return 'openrouter'
}

function getModelName(modelId: string): string {
  const idx = modelId.indexOf(':')
  if (idx === -1) return modelId

  const provider = modelId.slice(0, idx)
  return provider === 'openrouter' ||
    provider === 'nvidia' ||
    provider === 'anyrouter'
    ? modelId.slice(idx + 1)
    : modelId
}

function ModelSelectorComponent() {
  const { model, models, setModel } = useAgentModel()
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState('')

  const currentModel = models.find((item) => item.id === model)
  const currentProvider = getProviderFromModelId(model)
  const currentModelName = currentModel?.name ?? getModelName(model)
  const trimmedCustomInput = customInput.trim()

  const handleCustomModelSubmit = () => {
    if (!trimmedCustomInput) return
    setModel(trimmedCustomInput)
    setOpen(false)
  }

  return (
    <SidebarSection title="Model">
      <ModelSelector open={open} onOpenChange={setOpen}>
        <ModelSelectorTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-full justify-between rounded-md border-border/60 bg-background/70 px-2 py-1.5 shadow-[0_1px_0_0_rgba(0,0,0,0.02)] transition-[transform,background-color,border-color] hover:bg-muted/20 active:scale-[0.99]"
            aria-label="Select model"
          >
            <div className="flex min-w-0 items-center gap-2 overflow-hidden text-left">
              <ModelSelectorLogo
                provider={currentProvider}
                className="size-3.5 shrink-0 dark:invert-0"
              />
              <span className="flex min-w-0 items-center gap-1.5 overflow-hidden font-mono text-xs font-medium text-foreground">
                <Badge variant="outline" className={MODEL_PROVIDER_BADGE_CLASS}>
                  {currentProvider}
                </Badge>
                <span className="min-w-0 truncate">{currentModelName}</span>
                {currentModel?.available === false ? (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-amber-400/60 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700 hover:text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:text-amber-400"
                  >
                    No key
                  </Badge>
                ) : null}
              </span>
            </div>
            <ChevronDownIcon className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Button>
        </ModelSelectorTrigger>

        <ModelSelectorContent
          title="Select Model"
          className="max-w-[min(92vw,34rem)] overflow-hidden border-border/70 bg-background/95 shadow-2xl [&>button]:right-2.5 [&>button]:top-2.5 [&>button]:h-7 [&>button]:w-7 [&>button]:rounded-md"
        >
          <ModelSelectorInput
            placeholder="Search models..."
            className="h-9 py-2 pr-8 text-[13px]"
          />
          <ModelSelectorList className="max-h-[min(58vh,22rem)] p-1 [scrollbar-width:thin]">
            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
            <ModelSelectorGroup
              heading="Available models"
              className="p-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em]"
            >
              {models.map((item) => {
                const provider = getProviderFromModelId(item.id)
                const selected = item.id === model
                const unavailable = item.available === false

                return (
                  <ModelSelectorItem
                    key={item.id}
                    value={item.id}
                    disabled={unavailable}
                    onSelect={() => {
                      if (unavailable) return
                      setModel(item.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'mx-0.5 my-0.5 grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5',
                      selected
                        ? 'bg-muted/60 ring-1 ring-border/70'
                        : 'border border-transparent hover:bg-muted/30',
                      unavailable && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ModelSelectorLogo
                        provider={provider}
                        className="size-3.5 shrink-0 dark:invert-0"
                      />
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={MODEL_PROVIDER_BADGE_CLASS}
                          >
                            {provider}
                          </Badge>
                          <span className="min-w-0 truncate font-mono text-xs font-medium text-foreground">
                            {item.name}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] leading-3 text-muted-foreground tabular-nums">
                          <span>{item.formattedContextLength} ctx</span>
                          {item.supportsTools ? <span>tools</span> : null}
                          {item.supportsVision ? <span>vision</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {item.isFree ? (
                        <Badge
                          className="rounded-full bg-emerald-100 px-1.5 py-0 text-[10px] text-emerald-700 hover:text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:text-emerald-400"
                          variant="outline"
                        >
                          Free
                        </Badge>
                      ) : item.pricing != null ? (
                        <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] leading-3 text-muted-foreground tabular-nums">
                          ${item.pricing.inputPerMillion}/$
                          {item.pricing.outputPerMillion}
                        </span>
                      ) : null}
                      {unavailable ? (
                        <Badge
                          variant="outline"
                          className="rounded-full border-amber-400/60 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700 hover:text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:text-amber-400"
                        >
                          No key
                        </Badge>
                      ) : selected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                      ) : null}
                    </div>
                  </ModelSelectorItem>
                )
              })}
            </ModelSelectorGroup>
            <ModelSelectorSeparator className="my-1" />
            <ModelSelectorGroup
              heading="Custom model"
              className="p-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em]"
            >
              <div className="mx-0.5 my-0.5 flex items-center gap-1.5 rounded-md bg-muted/20 px-2 py-1.5">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCustomModelSubmit()
                  }}
                  placeholder="Enter custom model ID..."
                  className="h-7 min-w-0 flex-1 rounded-md border border-border/60 bg-background px-2 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 shrink-0 rounded-md px-2 text-[11px]"
                  onClick={handleCustomModelSubmit}
                  disabled={!trimmedCustomInput}
                >
                  Use
                </Button>
              </div>
            </ModelSelectorGroup>
          </ModelSelectorList>
        </ModelSelectorContent>
      </ModelSelector>
    </SidebarSection>
  )
}

function McpToolRow({
  tool,
  enabled,
  onToggle,
}: {
  tool: ApiMcpTool
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted/20 p-2 transition-colors',
        !enabled && 'opacity-80'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
              {tool.name}
            </code>
            <Badge
              variant={enabled ? 'default' : 'secondary'}
              className="rounded-full"
            >
              {enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="mt-1.5 text-xs leading-4 text-muted-foreground">
            {tool.description}
          </p>
          {tool.params.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tool.params.map((param) => (
                <Badge
                  key={param.name}
                  variant="outline"
                  className="rounded-full px-2 py-0.5 text-[10px]"
                >
                  {param.name}:{param.type}
                  {!param.required ? ' optional' : ''}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="h-4 w-8 bg-muted-foreground/20 shadow-none data-[state=checked]:bg-primary [&>span]:h-3 [&>span]:w-3 [&>span]:bg-background"
          aria-label={`${enabled ? 'Disable' : 'Enable'} ${tool.name}`}
        />
      </div>
    </div>
  )
}

function McpToolsSection() {
  const { data: mcpInfo, isLoading, error, retry } = useMcpServerInfo()
  const { isToolEnabled, toggleTool } = useToolConfig()
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionName: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionName)) {
        next.delete(sectionName)
      } else {
        next.add(sectionName)
      }
      return next
    })
  }

  const expandAll = () => {
    setOpenSections(new Set(['Resources', ...Object.keys(MCP_TOOL_CATEGORIES)]))
  }

  const collapseAll = () => {
    setOpenSections(new Set())
  }

  const action = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 rounded-md px-2 text-[11px]"
        onClick={expandAll}
        title="Expand all"
      >
        Expand
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 rounded-md px-2 text-[11px]"
        onClick={collapseAll}
        title="Collapse all"
      >
        Collapse
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <SidebarSection title="MCP Server" description="Loading server metadata.">
        <p className="text-xs text-muted-foreground">Loading tools...</p>
      </SidebarSection>
    )
  }

  if (error) {
    return (
      <SidebarSection
        title="MCP Server"
        description="We could not load the server metadata right now."
        action={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={retry}
                className="h-8 w-8 rounded-full"
                title="Retry loading tools"
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Retry loading tools</TooltipContent>
          </Tooltip>
        }
      >
        <p className="text-xs text-destructive">Failed to load tools.</p>
      </SidebarSection>
    )
  }

  if (!mcpInfo) {
    return (
      <SidebarSection
        title="MCP Server"
        description="No MCP server metadata is available."
      >
        <p className="text-xs text-muted-foreground">Unable to load tools.</p>
      </SidebarSection>
    )
  }

  const toolCategories = Object.keys(MCP_TOOL_CATEGORIES) as McpToolCategory[]

  return (
    <SidebarSection
      title="MCP Server"
      description="Review available resources and enable the tools the agent can call."
      action={action}
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-md bg-muted/15 px-2 py-1.5">
          <DatabaseIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-foreground">
              {mcpInfo.name}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
              {mcpInfo.tools.length} tools, {mcpInfo.resources.length} resources
            </div>
          </div>
          <Badge variant="outline" className="rounded-full px-1.5 text-[10px]">
            v{mcpInfo.version}
          </Badge>
        </div>

        {mcpInfo.resources.length > 0 ? (
          <Collapsible
            open={openSections.has('Resources')}
            onOpenChange={() => toggleSection('Resources')}
          >
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/25">
              <TreeTriggerIcon open={openSections.has('Resources')} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">Resources</div>
                <div className="text-[11px] text-muted-foreground">
                  {mcpInfo.resources.length} resource
                  {mcpInfo.resources.length === 1 ? '' : 's'}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-2 space-y-1.5 border-l border-border/30 pl-2 pt-1">
              {mcpInfo.resources.map((resource: McpResource) => (
                <div key={resource.name} className="rounded-md bg-muted/15 p-2">
                  <div className="text-xs font-medium text-foreground">
                    {resource.name}
                  </div>
                  <p className="mt-1 text-xs leading-4 text-muted-foreground">
                    {resource.description}
                  </p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : null}

        {toolCategories.map((categoryKey) => {
          const categoryInfo = MCP_TOOL_CATEGORIES[categoryKey]
          const tools = mcpInfo.tools.filter(
            (tool: ApiMcpTool) => tool.category === categoryKey
          )

          if (tools.length === 0) return null

          return (
            <Collapsible
              key={categoryKey}
              open={openSections.has(categoryKey)}
              onOpenChange={() => toggleSection(categoryKey)}
            >
              <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/25">
                <TreeTriggerIcon open={openSections.has(categoryKey)} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-foreground">
                    {categoryInfo.icon} {categoryInfo.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {tools.length} tool{tools.length === 1 ? '' : 's'}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-2 space-y-1.5 border-l border-border/30 pl-2 pt-1">
                {tools.map((tool: ApiMcpTool) => (
                  <McpToolRow
                    key={tool.name}
                    tool={tool}
                    enabled={isToolEnabled(tool.name)}
                    onToggle={() => toggleTool(tool.name)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </SidebarSection>
  )
}

function SkillsSection() {
  const [showTree, setShowTree] = useState(false)
  const skills = useMemo(() => getSkillsMetadata(), [])
  const skillDetails = useMemo(() => {
    if (!showTree) return []

    return skills
      .map((skill) => {
        const content = loadSkillContent(skill.name)
        return content
          ? {
              name: content.name,
              description: content.description,
              content: content.content,
            }
          : null
      })
      .filter((skill): skill is NonNullable<typeof skill> => skill !== null)
  }, [skills, showTree])

  if (skills.length === 0) return null

  return (
    <>
      <SidebarSection
        title="Skills"
        description="Browse the bundled expert guides the agent can load on demand."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTree(true)}
            className="h-7 rounded-md px-2 text-[11px] transition-[transform,background-color,border-color] active:scale-[0.96]"
          >
            Open tree
          </Button>
        }
      >
        <button
          type="button"
          onClick={() => setShowTree(true)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-[transform,background-color] hover:bg-muted/30 active:scale-[0.99]"
        >
          <BookOpenIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-foreground">
              Skill library
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums">
              {skills.length} available skill
              {skills.length === 1 ? '' : 's'}
            </div>
          </div>
        </button>
      </SidebarSection>

      <SkillsTreeDialog
        skills={skillDetails}
        open={showTree}
        onOpenChange={setShowTree}
      />
    </>
  )
}

function SuggestedPromptsSection({
  messages = [],
  onSubmitPrompt,
}: {
  readonly messages?: readonly UIMessage[]
  readonly onSubmitPrompt?: (prompt: string) => void
}) {
  const [showMore, setShowMore] = useState(false)
  const prompts = useMemo(
    () => getSuggestedPrompts({ messages, limit: showMore ? 8 : 3 }),
    [messages, showMore]
  )

  return (
    <SidebarSection
      title="Suggested prompts"
      description="Context-aware starter questions for the current conversation."
      action={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowMore((value) => !value)}
          className="h-7 rounded-md px-2 text-[11px] transition-[transform,background-color] active:scale-[0.96]"
        >
          {showMore ? 'Show less' : 'Show more'}
        </Button>
      }
    >
      <div className="space-y-1">
        {prompts.map((prompt) => (
          <button
            type="button"
            key={prompt.text}
            className="group flex min-h-8 w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs leading-4 text-muted-foreground transition-[transform,background-color,color] hover:bg-muted/30 hover:text-foreground active:scale-[0.96]"
            onClick={() => onSubmitPrompt?.(prompt.text)}
          >
            <span className="mt-0.5 inline-flex h-3.5 shrink-0 items-center rounded-full bg-muted px-1 text-[8px] font-medium uppercase leading-3 tracking-[0.08em] text-muted-foreground group-hover:text-foreground">
              {prompt.category}
            </span>
            <span className="min-w-0 flex-1">{prompt.text}</span>
          </button>
        ))}
      </div>
    </SidebarSection>
  )
}

export function AgentsSidebar({
  hostId,
  messages,
  onSubmitPrompt,
  isOpen,
  onOpenChange,
}: AgentsSidebarProps) {
  const isMobile = useIsMobile()

  const content = (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar/20">
      <div className="border-border/60 border-b bg-background/70 px-2.5 py-2 backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold tracking-tight text-foreground [text-wrap:balance]">
              Agent settings
            </h3>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground [text-wrap:pretty]">
              Host, model, tools, and skills.
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange?.(false)}
                className="h-7 w-7 shrink-0 rounded-md transition-[transform,background-color,border-color] active:scale-[0.96]"
                aria-label="Hide settings sidebar"
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Hide settings sidebar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable] [scrollbar-width:thin]">
        <div className="space-y-2 p-2">
          <HostSelector hostId={hostId} />
          <ModelSelectorComponent />
          <SessionMetricsSection messages={messages} />
          <McpToolsSection />
          <SkillsSection />
          <SuggestedPromptsSection
            messages={messages}
            onSubmitPrompt={onSubmitPrompt}
          />
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[min(380px,92vw)] border-l border-border/60 p-0"
        >
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return isOpen ? (
    <aside className="hidden h-full w-80 shrink-0 border-l border-border/60 md:flex xl:w-[22rem]">
      {content}
    </aside>
  ) : null
}

function SessionMetricsSection({
  messages = [],
}: {
  messages?: readonly UIMessage[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const stats = useAgentSessionStats(messages)

  if (stats.requestCount === 0) return null

  return (
    <>
      <SidebarSection
        title="Session metrics"
        description="Real-time monitoring of agent performance, token usage, and estimated costs."
        action={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-md px-2 text-[11px] transition-colors hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsDialogOpen(true)}
          >
            Details
          </Button>
        }
      >
        <div
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-background/40 p-3 transition-all hover:border-primary/30 hover:bg-muted/10 active:scale-[0.98]"
          onClick={() => setIsDialogOpen(true)}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                <ZapIcon className="size-3 text-amber-500" />
                Tokens
              </div>
              <div className="text-sm font-bold tabular-nums">
                {formatReadableQuantity(stats.totalTokens)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                <CoinsIcon className="size-3 text-emerald-500" />
                Cost
              </div>
              <div className="text-sm font-bold tabular-nums">
                {stats.estimatedCostUsd !== null
                  ? `$${stats.estimatedCostUsd.toFixed(4)}`
                  : '—'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                <ActivityIcon className="size-3 text-blue-500" />
                Tool Calls
              </div>
              <div className="text-sm font-bold tabular-nums">
                {stats.toolCallCount}
              </div>
            </div>
            <div className="flex flex-col justify-end space-y-1 text-right">
              <span className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground transition-colors group-hover:text-primary">
                See details <ChevronRightIcon className="size-3" />
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </SidebarSection>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <UIDialogContent className="border-border/60 shadow-2xl backdrop-blur-xl sm:max-w-md">
          <DialogHeader className="pb-4">
            <div className="mb-1 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <BarChart3Icon className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Session Analytics</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Comprehensive breakdown of your AI agent session.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-muted/20 p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Total Messages
                </span>
                <span className="text-2xl font-bold tabular-nums">
                  {stats.totalMessages}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-muted/20 p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Tool Executions
                </span>
                <span className="text-2xl font-bold tabular-nums">
                  {stats.toolCallCount}
                </span>
              </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <ZapIcon className="size-3.5 text-amber-500" />
                Token Breakdown
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Input (Context)</span>
                  <span className="font-mono tabular-nums">
                    {stats.totalInputTokens.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Output (Generated)
                  </span>
                  <span className="font-mono tabular-nums">
                    {stats.totalOutputTokens.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border/20 pt-2 text-sm font-bold">
                  <span>Total Tokens</span>
                  <span className="font-mono tabular-nums">
                    {stats.totalTokens.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CoinsIcon className="size-3.5 text-emerald-500" />
                Cost Estimate
              </h4>
              <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-4 dark:border-emerald-800/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400">
                    Estimated Session Cost
                  </span>
                  <span className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {stats.estimatedCostUsd !== null
                      ? `$${stats.estimatedCostUsd.toFixed(4)}`
                      : '—'}
                  </span>
                </div>
              </div>
              <p className="px-1 text-[10px] italic text-muted-foreground">
                * Cost estimates are calculated based on model pricing and token
                counts. Real costs may vary.
              </p>
            </div>
          </div>
        </UIDialogContent>
      </Dialog>
    </>
  )
}

function formatReadableQuantity(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toString()
}
