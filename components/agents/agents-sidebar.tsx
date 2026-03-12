'use client'

import {
  ChevronDownIcon,
  ChevronRightIcon,
  MonitorIcon,
  XIcon,
} from 'lucide-react'

import { AgentSettings } from './agent-settings'
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
import {
  getToolMetadata,
  SUGGESTED_PROMPTS,
  TOOL_CATEGORIES,
} from '@/lib/ai/agent/metadata'
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

function ToolsSection() {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(['Schema'])
  )

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryName)) {
        next.delete(categoryName)
      } else {
        next.add(categoryName)
      }
      return next
    })
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
        Available Tools
      </h3>
      <div className="space-y-2">
        {TOOL_CATEGORIES.map((category) => (
          <Collapsible
            key={category.name}
            open={openCategories.has(category.name)}
            onOpenChange={() => toggleCategory(category.name)}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md transition-colors">
              <span className="text-sm font-medium flex items-center gap-2">
                <span>{category.icon}</span>
                {category.name} Tools
              </span>
              {openCategories.has(category.name) ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              {category.tools.map((toolName) => {
                const tool = getToolMetadata(toolName)
                return (
                  <div
                    key={toolName}
                    className="text-xs text-muted-foreground py-1"
                  >
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {toolName}
                    </code>
                    <p className="mt-1 text-xs opacity-80">
                      {tool?.description || ''}
                    </p>
                  </div>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}

function SuggestedPromptsSection() {
  return (
    <div>
      <h3 className="text-xs font-medium text-foreground mb-2">
        Try asking...
      </h3>
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
        {/* Host and Model Settings */}
        <HostSelector hostId={hostId} />
        <AgentSettings />

        <Separator />

        {/* Tools Section */}
        <ToolsSection />

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
