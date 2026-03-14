'use client'

import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DatabaseIcon,
  MonitorIcon,
  RefreshCwIcon,
  XIcon,
} from 'lucide-react'

import type {
  McpResource,
  McpToolCategory,
} from '@/components/mcp/mcp-tools-data'
import type { ApiMcpTool } from '@/lib/swr/use-mcp-server-info'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { SUGGESTED_PROMPTS } from '@/lib/ai/agent/metadata'
import { getSkillsMetadata } from '@/lib/ai/agent/skills/registry'
import { OPENAI_MODELS, useAgentModel } from '@/lib/hooks/use-agent-model'
import { useToolConfig } from '@/lib/hooks/use-tool-config'
import { useMcpServerInfo } from '@/lib/swr'
import { useHosts } from '@/lib/swr/use-hosts'
import { cn } from '@/lib/utils'

interface AgentsSidebarProps {
  hostId: number
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function HostSelector({ hostId }: { readonly hostId: number }) {
  const router = useRouter()
  const { hosts } = useHosts()

  const handleHostChange = (newHostId: string) => {
    // Update URL query parameter to switch hosts
    const url = new URL(window.location.href)
    url.searchParams.set('host', newHostId)
    router.push(url.toString())
  }

  return (
    <div className="mb-4">
      <label className="text-xs text-muted-foreground mb-1.5 block">Host</label>
      <Select value={String(hostId)} onValueChange={handleHostChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select host" />
        </SelectTrigger>
        <SelectContent>
          {hosts.map((host, index) => (
            <SelectItem key={index} value={String(index)} className="text-xs">
              <div className="flex items-center gap-2">
                <MonitorIcon className="h-3 w-3" />
                <span>{host.name || `Host ${index}`}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Maps a model ID prefix to its provider key for ModelSelectorLogo */
function getProviderFromModelId(modelId: string): string {
  if (modelId.startsWith('nvidia/')) return 'nvidia'
  if (modelId.startsWith('stepfun/')) return 'openai' // no stepfun logo, fallback
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

  const currentModelInfo = OPENAI_MODELS[model as keyof typeof OPENAI_MODELS]
  const currentProvider = getProviderFromModelId(model)

  return (
    <div className="mb-4">
      <label className="text-xs text-muted-foreground mb-1.5 block">
        Model
      </label>
      <ModelSelector open={open} onOpenChange={setOpen}>
        <ModelSelectorTrigger asChild>
          <Button
            variant="outline"
            className="h-8 w-full justify-start gap-2 px-2 text-xs font-normal"
            aria-label="Select model"
          >
            <ModelSelectorLogo
              provider={currentProvider}
              className="shrink-0"
            />
            <span className="truncate">{currentModelInfo?.name ?? model}</span>
          </Button>
        </ModelSelectorTrigger>
        <ModelSelectorContent title="Select Model">
          <ModelSelectorInput placeholder="Search models..." />
          <ModelSelectorList>
            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
            <ModelSelectorGroup heading="Available Models">
              {models.map((m) => {
                const provider = getProviderFromModelId(m.id)
                return (
                  <ModelSelectorItem
                    key={m.id}
                    value={m.id}
                    onSelect={() => {
                      setModel(m.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 py-2"
                  >
                    <ModelSelectorLogo
                      provider={provider}
                      className="shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm">{m.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {m.description}
                      </span>
                    </div>
                    {m.id === model && (
                      <span className="ml-auto text-xs text-primary shrink-0">
                        ✓
                      </span>
                    )}
                  </ModelSelectorItem>
                )
              })}
            </ModelSelectorGroup>
          </ModelSelectorList>
        </ModelSelectorContent>
      </ModelSelector>
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
    const allSections = [
      'server',
      'Resources',
      ...Object.keys(MCP_TOOL_CATEGORIES),
    ]
    setOpenSections(new Set(allSections))
  }

  const collapseAll = () => {
    setOpenSections(new Set())
  }

  if (isLoading) {
    return (
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-1.5 block">
          MCP Server
        </label>
        <p className="text-xs text-muted-foreground">Loading tools...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-muted-foreground">MCP Server</label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={retry}
                className="h-5 w-5"
                title="Retry loading tools"
              >
                <RefreshCwIcon className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Retry loading tools</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-xs text-destructive">Failed to load tools</p>
      </div>
    )
  }

  if (!mcpInfo) {
    return (
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-1.5 block">
          MCP Server
        </label>
        <p className="text-xs text-muted-foreground">Unable to load tools</p>
      </div>
    )
  }

  // Group tools by category from the API response
  const toolCategories = Object.keys(MCP_TOOL_CATEGORIES) as McpToolCategory[]

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-muted-foreground">MCP Server</label>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs"
            onClick={expandAll}
            title="Expand all"
          >
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs"
            onClick={collapseAll}
            title="Collapse all"
          >
            <ChevronRightIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tree structure with server name as root */}
      <div className="relative">
        {/* Vertical line for tree */}
        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-0.5">
          {/* Server node (root) */}
          <Collapsible
            open={openSections.has('server')}
            onOpenChange={() => toggleSection('server')}
          >
            <CollapsibleTrigger className="flex items-center gap-1.5 w-full py-1.5 px-2 hover:bg-muted rounded-md transition-colors text-left">
              <span className="relative z-10 flex items-center justify-center w-4 h-4 bg-background">
                {openSections.has('server') ? (
                  <ChevronDownIcon className="h-3 w-3" />
                ) : (
                  <ChevronRightIcon className="h-3 w-3" />
                )}
              </span>
              <DatabaseIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{mcpInfo.name}</span>
              <span className="text-xs text-muted-foreground">
                v{mcpInfo.version}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Child items with connecting lines */}
              <div className="ml-5 py-0.5 space-y-0.5">
                {/* Resources Section */}
                {mcpInfo.resources.length > 0 && (
                  <Collapsible
                    open={openSections.has('Resources')}
                    onOpenChange={() => toggleSection('Resources')}
                  >
                    <CollapsibleTrigger className="flex items-center gap-1.5 w-full py-1 px-2 hover:bg-muted rounded-md transition-colors text-left">
                      <span className="relative z-10 flex items-center justify-center w-4 h-4 bg-background">
                        {openSections.has('Resources') ? (
                          <ChevronDownIcon className="h-3 w-3" />
                        ) : (
                          <ChevronRightIcon className="h-3 w-3" />
                        )}
                      </span>
                      <span className="text-sm">Resources</span>
                      <span className="text-xs text-muted-foreground">
                        ({mcpInfo.resources.length})
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {mcpInfo.resources.map((resource: McpResource) => (
                        <div key={resource.name} className="relative pl-8">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-muted-foreground py-1 px-2 hover:bg-muted/50 rounded cursor-help">
                                <span className="font-medium text-foreground">
                                  {resource.name}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>{resource.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Tools by Category */}
                {toolCategories.map((categoryKey) => {
                  const categoryInfo = MCP_TOOL_CATEGORIES[categoryKey]
                  const tools = mcpInfo.tools.filter(
                    (t: ApiMcpTool) => t.category === categoryKey
                  )

                  if (tools.length === 0) return null

                  return (
                    <Collapsible
                      key={categoryKey}
                      open={openSections.has(categoryKey)}
                      onOpenChange={() => toggleSection(categoryKey)}
                    >
                      <CollapsibleTrigger className="flex items-center gap-1.5 w-full py-1 px-2 hover:bg-muted rounded-md transition-colors text-left">
                        <span className="relative z-10 flex items-center justify-center w-4 h-4 bg-background">
                          {openSections.has(categoryKey) ? (
                            <ChevronDownIcon className="h-3 w-3" />
                          ) : (
                            <ChevronRightIcon className="h-3 w-3" />
                          )}
                        </span>
                        <span className="text-sm">
                          {categoryInfo.icon} {categoryInfo.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({tools.length})
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {tools.map((tool: ApiMcpTool) => {
                          const enabled = isToolEnabled(tool.name)
                          return (
                            <div
                              key={tool.name}
                              className="relative pl-8 flex items-center gap-2"
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      'flex-1 text-xs text-muted-foreground py-1 px-2 hover:bg-muted/50 rounded cursor-help',
                                      !enabled && 'opacity-50'
                                    )}
                                  >
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                      {tool.name}
                                    </code>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs"
                                >
                                  <div className="space-y-1">
                                    <p className="font-medium">
                                      {tool.description}
                                    </p>
                                    {tool.params.length > 0 && (
                                      <div className="text-xs text-muted-foreground space-y-0.5">
                                        <div className="font-medium mt-2">
                                          Parameters:
                                        </div>
                                        {tool.params.map((param) => (
                                          <div
                                            key={param.name}
                                            className="flex items-center gap-1"
                                          >
                                            <span
                                              className={cn(
                                                param.required
                                                  ? 'text-foreground'
                                                  : 'text-muted-foreground opacity-70'
                                              )}
                                            >
                                              {param.name}
                                            </span>
                                            <span className="text-muted-foreground">
                                              :{param.type}
                                            </span>
                                            {!param.required && (
                                              <span className="text-muted-foreground/60 text-[10px]">
                                                optional
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                              {/* Tool toggle switch */}
                              <Switch
                                checked={enabled}
                                onCheckedChange={() => toggleTool(tool.name)}
                                className="h-4 w-7 shrink-0 mr-2"
                                aria-label={`${enabled ? 'Disable' : 'Enable'} ${tool.name}`}
                              />
                            </div>
                          )
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}

function SkillsSection() {
  const skills = getSkillsMetadata()
  const [isOpen, setIsOpen] = useState(true)

  if (skills.length === 0) return null

  return (
    <div className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 w-full py-1.5 px-2 hover:bg-muted rounded-md transition-colors text-left">
          <span className="relative z-10 flex items-center justify-center w-4 h-4 bg-background">
            {isOpen ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronRightIcon className="h-3 w-3" />
            )}
          </span>
          <BookOpenIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Skills</span>
          <span className="text-xs text-muted-foreground">
            ({skills.length})
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-5 py-0.5 space-y-0.5">
            {skills.map((skill) => (
              <Tooltip key={skill.name}>
                <TooltipTrigger asChild>
                  <div className="text-xs text-muted-foreground py-1 px-2 hover:bg-muted/50 rounded cursor-help">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {skill.name}
                    </code>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>{skill.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function SuggestedPromptsSection() {
  return (
    <div>
      <ul className="space-y-1">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <li
            key={i}
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer rounded px-2 py-1.5"
          >
            {prompt}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AgentsSidebar({
  hostId,
  isOpen,
  onOpenChange,
}: AgentsSidebarProps) {
  const isMobile = useIsMobile()

  const content = (
    <div className="h-full overflow-auto">
      <div className="p-5 space-y-4">
        {/* Host Selector */}
        <HostSelector hostId={hostId} />

        {/* Model Selector */}
        <ModelSelectorComponent />

        <Separator />

        {/* MCP Tools Section */}
        <McpToolsSection />

        <Separator />

        {/* Skills Section */}
        <SkillsSection />

        <Separator />

        {/* Suggested Prompts */}
        <SuggestedPromptsSection />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[min(340px,90vw)] p-0">
          <div className="flex h-full flex-col">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <>
      {isOpen ? (
        <div className="w-80 lg:w-96 border-l h-full shrink-0 hidden md:flex flex-col">
          {/* Header - clickable title to close */}
          <div
            className="flex items-center justify-between border-b px-4 py-2.5 shrink-0 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onOpenChange?.(false)}
          >
            <h3 className="font-semibold text-sm">Agent Settings</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onOpenChange?.(false)
              }}
              className="h-7 w-7"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          {content}
        </div>
      ) : null}
    </>
  )
}
