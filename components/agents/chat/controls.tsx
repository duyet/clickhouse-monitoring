'use client'

import {
  PanelRightClose,
  PanelRightOpen,
  SparklesIcon,
  TrashIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

interface AgentChatControlsProps {
  readonly onClear: () => void
}

interface AgentChatHeaderProps extends AgentChatControlsProps {
  readonly isSidebarOpen: boolean
  readonly onMenuClick: () => void
}

export function AgentChatHeader({
  isSidebarOpen,
  onClear,
  onMenuClick,
}: AgentChatHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b px-3 py-3 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="h-8 w-8 shrink-0"
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isSidebarOpen ? (
          <PanelRightClose className="h-4 w-4" />
        ) : (
          <PanelRightOpen className="h-4 w-4" />
        )}
      </Button>

      <div className="flex min-w-0 items-center gap-2">
        <SparklesIcon className="h-5 w-5 shrink-0 text-primary" />
        <h2 className="truncate text-sm font-semibold sm:text-base">
          AI Agent
        </h2>
      </div>

      <AgentChatActions onClear={onClear} />
    </div>
  )
}

export function AgentChatCompactControls({ onClear }: AgentChatControlsProps) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-1 border-b px-3 py-2">
      <AgentChatActions onClear={onClear} />
    </div>
  )
}

function AgentChatActions({ onClear }: AgentChatControlsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        className="h-8 w-8"
        aria-label="Clear conversation"
        title="Clear conversation"
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
