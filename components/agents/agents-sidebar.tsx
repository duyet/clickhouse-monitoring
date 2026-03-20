'use client'

import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DatabaseIcon,
  MonitorIcon,
  PanelRightClose,
  RefreshCwIcon,
} from 'lucide-react'

import type { ReactNode } from 'react'
import type {
  McpResource,
  McpToolCategory,
} from '@/components/mcp/mcp-tools-data'
import type { ApiMcpTool } from '@/lib/swr/use-mcp-server-info'

import { useRouter } from 'next/navigation'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { cleanQuotedText, cn } from '@/lib/utils'

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
    <section className="rounded-xl border border-border/60 bg-card/50">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{title}</div>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-3">{children}</div>
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
  const router = useRouter()
  const { hosts } = useHosts()

  const handleHostChange = (newHostId: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('host', newHostId)
    router.push(url.toString())
  }

  return (
    <SidebarSection
      title="Host"
      description="Route the agent to the ClickHouse server you want to inspect."
    >
      <Select value={String(hostId)} onValueChange={handleHostChange}>
        <SelectTrigger className="h-10 rounded-lg border-border/60 bg-background/70 text-sm">
          <SelectValue placeholder="Select host" />
        </SelectTrigger>
        <SelectContent>
          {hosts.map((host, index) => (
            <SelectItem key={index} value={String(index)} className="text-sm">
              <div className="flex items-center gap-2">
                <MonitorIcon className="h-3.5 w-3.5" />
                <span>{host.name || `Host ${index}`}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SidebarSection>
  )
}

function getProviderFromModelId(modelId: string): string {
  if (modelId.startsWith('nvidia/')) return 'nvidia'
  if (modelId.startsWith('stepfun/')) return 'openai'
  if (modelId.startsWith('z-ai/')) return 'zai'
  if (modelId.startsWith('google/') || modelId.startsWith('google-'))
    return 'google'
  if (modelId.startsWith('meta-llama/')) return 'llama'
  if (modelId.startsWith('anthropic/')) return 'anthropic'
  if (modelId.startsWith('mistral/')) return 'mistral'
  if (modelId.startsWith('deepseek/')) return 'deepseek'
  if (modelId.startsWith('openai/')) return 'openai'
  return 'openrouter'
}

function ModelSelectorComponent() {
  const { model, models, setModel } = useAgentModel()
  const [open, setOpen] = useState(false)

  const currentModel = models.find((item) => item.id === model)
  const currentProvider = getProviderFromModelId(model)

  return (
    <SidebarSection
      title="Model"
      description="Choose the default model the agent should use for this session."
    >
      <ModelSelector open={open} onOpenChange={setOpen}>
        <ModelSelectorTrigger asChild>
          <Button
            variant="outline"
            className="h-auto w-full justify-between rounded-lg border-border/60 bg-background/70 px-3 py-2.5"
            aria-label="Select model"
          >
            <div className="flex min-w-0 items-start gap-3 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                <ModelSelectorLogo
                  provider={currentProvider}
                  className="size-3.5 shrink-0 dark:invert-0"
                />
              </span>
              <div className="min-w-0">
                <div className="truncate font-mono text-[13px] font-medium text-foreground">
                  {currentModel?.name ?? model}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {currentModel?.description ?? 'Custom model'}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="ml-3 shrink-0 rounded-full">
              {currentModel?.contextLength != null
                ? `${currentModel.contextLength.toLocaleString()} ctx`
                : 'ctx unknown'}
            </Badge>
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

                return (
                  <ModelSelectorItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      setModel(item.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'mx-2 my-1 flex items-start gap-3 rounded-lg px-3 py-2.5',
                      selected
                        ? 'bg-muted/60'
                        : 'border border-transparent hover:bg-muted/35'
                    )}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                      <ModelSelectorLogo
                        provider={provider}
                        className="size-3.5 shrink-0 dark:invert-0"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[13px] font-medium text-foreground">
                        {item.id}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant="outline" className="rounded-full">
                        {item.contextLength.toLocaleString()} ctx
                      </Badge>
                      {selected ? (
                        <Badge className="rounded-full">Selected</Badge>
                      ) : null}
                    </div>
                  </ModelSelectorItem>
                )
              })}
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
        'rounded-lg border border-border/60 bg-background/70 p-2.5 transition-colors',
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
        <div className="rounded-full border border-border/60 bg-muted/20 p-0.5">
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            className="h-5 w-9 border border-border/60 bg-muted-foreground/15 shadow-none data-[state=checked]:bg-primary [&>span]:bg-background"
            aria-label={`${enabled ? 'Disable' : 'Enable'} ${tool.name}`}
          />
        </div>
      </div>
    </div>
  )
}

function McpToolsSection() {
  const { data: mcpInfo, isLoading, error, retry } = useMcpServerInfo()
  const { isToolEnabled, toggleTool } = useToolConfig()
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['server', 'Resources', 'schema', 'system'])
  )

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
        title="MCP Server"
        description="Loading available tools and resources."
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
          <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2.5 text-left transition-colors hover:bg-muted/30">
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
  const [isOpen, setIsOpen] = useState(true)
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
            className="h-8 rounded-full px-3 text-xs"
          >
            Open tree
          </Button>
        }
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2.5 text-left transition-colors hover:bg-muted/30">
            <TreeTriggerIcon open={isOpen} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                Skill library
              </div>
              <div className="text-xs text-muted-foreground">
                {skills.length} available skill
                {skills.length === 1 ? '' : 's'}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2 pt-3">
            {skillDetails.map((skill) => (
              <button
                key={skill.name}
                type="button"
                onClick={() => setShowTree(true)}
                className="flex w-full items-start gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5 text-left transition-colors hover:bg-muted/25"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                  <BookOpenIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[13px] font-medium text-foreground">
                    {skill.name}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {cleanQuotedText(skill.description)}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 rounded-full">
                  Open tree
                </Badge>
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
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
            className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5 text-xs leading-5 text-muted-foreground transition-colors hover:bg-muted/25 hover:text-foreground"
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
            <h3 className="text-sm font-semibold text-foreground">
              Agent settings
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Model, tools, and skill controls for the current workspace.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            className="h-9 rounded-full px-3"
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
