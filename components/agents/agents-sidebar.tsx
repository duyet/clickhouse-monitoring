'use client'

import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DatabaseIcon,
  HelpCircleIcon,
  MonitorIcon,
  PanelRightClose,
  RefreshCwIcon,
} from 'lucide-react'

// ChevronDownIcon already imported above

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
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { SUGGESTED_PROMPTS } from '@/lib/ai/agent/metadata'
import {
  getSkillsMetadata,
  loadSkillContent,
} from '@/lib/ai/agent/skills/registry'
import { useAgentModel } from '@/lib/hooks/use-agent-model'
import { useToolConfig } from '@/lib/hooks/use-tool-config'
import { useMcpServerInfo } from '@/lib/swr'
import { useHosts } from '@/lib/swr/use-hosts'
import { cn } from '@/lib/utils'

interface AgentsSidebarProps {
  hostId: number
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

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
    <section>
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium tracking-tight text-foreground">
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
      <div className="pt-1 pb-3">{children}</div>
    </section>
  )
}

function TreeTriggerIcon({ open }: { open: boolean }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
      {open ? (
        <ChevronDownIcon className="h-3.5 w-3.5" />
      ) : (
        <ChevronRightIcon className="h-3.5 w-3.5" />
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
      <div className="flex h-10 items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 text-sm shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
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

function ModelSelectorComponent() {
  const { model, models, setModel } = useAgentModel()
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState('')

  const currentModel = models.find((item) => item.id === model)
  const currentProvider = getProviderFromModelId(model)
  const currentUnavailable = currentModel?.available === false
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
            className="h-auto w-full justify-between rounded-lg border-border/60 bg-background/70 px-3 py-2.5 shadow-[0_1px_0_0_rgba(0,0,0,0.02)] transition-[transform,background-color,border-color] active:scale-[0.99]"
            aria-label="Select model"
          >
            <div className="flex min-w-0 items-center gap-3 text-left">
              <ModelSelectorLogo
                provider={currentProvider}
                className="size-3.5 shrink-0 dark:invert-0"
              />
              <span className="flex min-w-0 items-center gap-1.5 font-mono text-[13px] font-medium text-foreground">
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-full px-1.5 py-0 text-[10px]"
                >
                  {currentProvider}
                </Badge>
                <span className="min-w-0 truncate">
                  {currentModel?.name ?? model}
                </span>
                {currentUnavailable ? (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-amber-400/60 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                  >
                    Not configured
                  </Badge>
                ) : null}
              </span>
            </div>
            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </ModelSelectorTrigger>

        <ModelSelectorContent
          title="Select Model"
          className="max-w-[min(92vw,44rem)] border-border/70 bg-background/95"
        >
          <ModelSelectorInput placeholder="Search models..." />
          <ModelSelectorList className="max-h-[24rem]">
            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
            <ModelSelectorGroup heading="Available Models">
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
                      'mx-2 my-1 flex items-start gap-3 rounded-lg px-3 py-2.5',
                      selected
                        ? 'bg-muted/60'
                        : 'border border-transparent hover:bg-muted/35',
                      unavailable && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <ModelSelectorLogo
                      provider={provider}
                      className="size-3.5 shrink-0 dark:invert-0"
                    />
                    <span className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium text-foreground">
                      <Badge
                        variant="outline"
                        className="mr-1.5 rounded-full text-[10px] px-1.5 py-0"
                      >
                        {provider}
                      </Badge>
                      {item.name}
                    </span>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge
                        variant="outline"
                        className="rounded-full tabular-nums"
                      >
                        {item.formattedContextLength} ctx
                      </Badge>
                      {item.isFree ? (
                        <Badge
                          className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          variant="outline"
                        >
                          Free
                        </Badge>
                      ) : item.pricing != null ? (
                        <span className="text-right text-[10px] leading-4 text-muted-foreground tabular-nums">
                          ${item.pricing.inputPerMillion}/M in
                          <br />${item.pricing.outputPerMillion}/M out
                        </span>
                      ) : null}
                      {unavailable ? (
                        <Badge
                          variant="outline"
                          className="rounded-full border-amber-400/60 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        >
                          Not configured
                        </Badge>
                      ) : selected ? (
                        <Badge className="rounded-full">Selected</Badge>
                      ) : null}
                    </div>
                  </ModelSelectorItem>
                )
              })}
            </ModelSelectorGroup>
            <ModelSelectorSeparator />
            <ModelSelectorGroup heading="Custom Model">
              <div className="mx-2 my-1 flex items-center gap-2 px-1 py-1.5">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCustomModelSubmit()
                  }}
                  placeholder="Enter custom model ID..."
                  className="h-8 min-w-0 flex-1 rounded-md border border-border/60 bg-background px-3 font-mono text-[13px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 shrink-0 rounded-md px-3 text-xs"
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
        'rounded-lg bg-muted/20 p-2.5 transition-colors',
        !enabled && 'opacity-80'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground">
              {tool.name}
            </code>
            <Badge
              variant={enabled ? 'default' : 'secondary'}
              className="rounded-full"
            >
              {enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {tool.description}
          </p>
          {tool.params.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
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
          className="h-5 w-9 bg-muted-foreground/20 shadow-none data-[state=checked]:bg-primary [&>span]:bg-background"
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
    setOpenSections(
      new Set(['server', 'Resources', ...Object.keys(MCP_TOOL_CATEGORIES)])
    )
  }

  const collapseAll = () => {
    setOpenSections(new Set())
  }

  const action = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 rounded-full px-3 text-xs"
        onClick={expandAll}
        title="Expand all"
      >
        Expand
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 rounded-full px-3 text-xs"
        onClick={collapseAll}
        title="Collapse all"
      >
        Collapse
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <SidebarSection
        title="Model"
        description="Choose the default model the agent should use for this session."
      >
        <p className="text-sm text-muted-foreground">Loading tools...</p>
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
        <p className="text-sm text-destructive">Failed to load tools.</p>
      </SidebarSection>
    )
  }

  if (!mcpInfo) {
    return (
      <SidebarSection
        title="MCP Server"
        description="No MCP server metadata is available."
      >
        <p className="text-sm text-muted-foreground">Unable to load tools.</p>
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
      <div className="space-y-3">
        <Collapsible
          open={openSections.has('server')}
          onOpenChange={() => toggleSection('server')}
        >
          <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/30">
            <TreeTriggerIcon open={openSections.has('server')} />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <DatabaseIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">
                {mcpInfo.name}
              </span>
              <Badge variant="outline" className="rounded-full">
                v{mcpInfo.version}
              </Badge>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="ml-3 space-y-2 border-l border-border/40 pl-3 pt-2">
            {mcpInfo.resources.length > 0 ? (
              <Collapsible
                open={openSections.has('Resources')}
                onOpenChange={() => toggleSection('Resources')}
              >
                <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/25">
                  <TreeTriggerIcon open={openSections.has('Resources')} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">Resources</div>
                    <div className="text-xs text-muted-foreground">
                      {mcpInfo.resources.length} resource
                      {mcpInfo.resources.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-3 space-y-1.5 border-l border-border/30 pl-3 pt-1.5">
                  {mcpInfo.resources.map((resource: McpResource) => (
                    <div
                      key={resource.name}
                      className="rounded-lg bg-muted/15 p-2.5"
                    >
                      <div className="text-sm font-medium text-foreground">
                        {resource.name}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
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
                  <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/25">
                    <TreeTriggerIcon open={openSections.has(categoryKey)} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {categoryInfo.icon} {categoryInfo.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tools.length} tool{tools.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-3 space-y-2 border-l border-border/30 pl-3 pt-1.5">
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
          </CollapsibleContent>
        </Collapsible>
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
            className="h-8 rounded-full px-3 text-xs transition-[transform,background-color,border-color] active:scale-[0.96]"
          >
            Open tree
          </Button>
        }
      >
        <button
          type="button"
          onClick={() => setShowTree(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-[transform,background-color] hover:bg-muted/30 active:scale-[0.99]"
        >
          <BookOpenIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground">
              Skill library
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
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

function SuggestedPromptsSection() {
  return (
    <SidebarSection
      title="Suggested prompts"
      description="A few starter questions you can paste into the conversation."
    >
      <ul className="space-y-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <li
            key={prompt}
            className="rounded-lg bg-muted/15 px-3 py-2.5 text-xs leading-5 text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
          >
            {prompt}
          </li>
        ))}
      </ul>
    </SidebarSection>
  )
}

export function AgentsSidebar({
  hostId,
  isOpen,
  onOpenChange,
}: AgentsSidebarProps) {
  const isMobile = useIsMobile()

  const content = (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar/20">
      <div className="border-b border-border/60 bg-background/70 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground [text-wrap:balance]">
              Agent settings
            </h3>
            <p className="mt-1 text-xs text-muted-foreground [text-wrap:pretty]">
              Model, tools, and skill controls for the current workspace.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            className="h-9 rounded-full px-3 transition-[transform,background-color,border-color] active:scale-[0.96]"
            aria-label="Hide settings sidebar"
          >
            <PanelRightClose className="mr-1 h-4 w-4" />
            Hide
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-3 p-3">
          <HostSelector hostId={hostId} />
          <ModelSelectorComponent />
          <McpToolsSection />
          <SkillsSection />
          <SuggestedPromptsSection />
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
    <aside className="hidden h-full w-80 shrink-0 border-l border-border/60 md:flex lg:w-[26rem]">
      {content}
    </aside>
  ) : null
}
