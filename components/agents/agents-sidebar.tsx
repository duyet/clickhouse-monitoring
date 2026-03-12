'use client'

import {
  ChevronDownIcon,
  ChevronRightIcon,
  DatabaseIcon,
  MonitorIcon,
  XIcon,
} from 'lucide-react'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { useIsMobile } from '@/hooks/use-mobile'
import { SUGGESTED_PROMPTS } from '@/lib/ai/agent/metadata'
import { useAgentModel } from '@/lib/hooks/use-agent-model'
import { useMcpServerInfo } from '@/lib/swr'
import { useHosts } from '@/lib/swr/use-hosts'

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

function ModelSelector() {
  const { model, models, setModel } = useAgentModel()

  return (
    <div className="mb-4">
      <label className="text-xs text-muted-foreground mb-1.5 block">
        Model
      </label>
      <Select value={model} onValueChange={setModel}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.id} value={m.id} className="text-xs">
              <div className="flex flex-col">
                <span className="font-medium">{m.name}</span>
                <span className="text-xs text-muted-foreground">
                  {m.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function McpToolsSection() {
  const { data: mcpInfo, isLoading } = useMcpServerInfo()
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['Tools'])
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

  if (isLoading) {
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          Available Tools
        </h3>
        <p className="text-xs text-muted-foreground">Loading tools...</p>
      </div>
    )
  }

  if (!mcpInfo) {
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          Available Tools
        </h3>
        <p className="text-xs text-muted-foreground">Unable to load tools</p>
      </div>
    )
  }

  // Group tools by category based on name prefix
  const toolCategories: Record<string, typeof mcpInfo.tools> = {
    Query: mcpInfo.tools.filter((t) => t.name === 'query'),
    Schema: mcpInfo.tools.filter(
      (t) => t.name.startsWith('list_') || t.name.startsWith('get_table_')
    ),
    System: mcpInfo.tools.filter(
      (t) => t.name.startsWith('get_') && t.name !== 'get_table_schema'
    ),
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {mcpInfo.name}
        </h3>
        <span className="text-xs text-muted-foreground">
          v{mcpInfo.version}
        </span>
      </div>

      <div className="space-y-2">
        {/* Resources Section */}
        <Collapsible
          open={openSections.has('Resources')}
          onOpenChange={() => toggleSection('Resources')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md transition-colors">
            <span className="text-sm font-medium flex items-center gap-2">
              <DatabaseIcon className="h-3.5 w-3.5" />
              Resources ({mcpInfo.resources.length})
            </span>
            {openSections.has('Resources') ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-5 space-y-1 mt-1">
            {mcpInfo.resources.map((resource) => (
              <div
                key={resource.name}
                className="text-xs text-muted-foreground py-1"
              >
                <span className="font-medium text-foreground">
                  {resource.name}
                </span>
                <p className="mt-0.5 opacity-80">{resource.description}</p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Tools by Category */}
        {Object.entries(toolCategories).map(([category, tools]) =>
          tools.length === 0 ? null : (
            <Collapsible
              key={category}
              open={openSections.has(category)}
              onOpenChange={() => toggleSection(category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md transition-colors">
                <span className="text-sm font-medium">{category}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  ({tools.length})
                  {openSections.has(category) ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="text-xs text-muted-foreground py-1"
                  >
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {tool.name}
                    </code>
                    <p className="mt-1 opacity-80">{tool.description}</p>
                    {tool.params.length > 0 && (
                      <div className="mt-1 pl-2 space-y-0.5">
                        {tool.params.map((param) => (
                          <div
                            key={param.name}
                            className="text-xs"
                            title={param.description}
                          >
                            <span className="text-blue-600 dark:text-blue-400">
                              {param.name}
                            </span>
                            <span className="text-muted-foreground">
                              :{param.type}
                            </span>
                            {!param.required && (
                              <span className="text-muted-foreground opacity-60">
                                ?
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )
        )}
      </div>
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
      <div className="p-4 space-y-4">
        {/* Host Selector */}
        <HostSelector hostId={hostId} />

        {/* Model Selector */}
        <ModelSelector />

        <Separator />

        {/* MCP Tools Section */}
        <McpToolsSection />

        <Separator />

        {/* Suggested Prompts */}
        <SuggestedPromptsSection />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[min(320px,85vw)] p-0">
          <div className="flex h-full flex-col">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <>
      {isOpen ? (
        <div className="w-72 lg:w-80 border-l h-full shrink-0 hidden md:flex flex-col">
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
