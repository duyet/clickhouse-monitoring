'use client'

import {
  PanelRightClose,
  PanelRightOpen,
  SparklesIcon,
  SquareIcon,
  TrashIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

interface AgentChatControlsProps {
  readonly isLoading: boolean
  readonly onClear: () => void
  readonly onStop: () => void
}

interface AgentChatHeaderProps extends AgentChatControlsProps {
  readonly isSidebarOpen: boolean
  readonly onMenuClick: () => void
}

export function AgentChatHeader({
  isSidebarOpen,
  isLoading,
  onClear,
  onMenuClick,
  onStop,
}: AgentChatHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b px-3 py-3 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="h-8 w-8 shrink-0"
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

      <AgentChatActions
        isLoading={isLoading}
        onClear={onClear}
        onStop={onStop}
      />
    </div>
  )
}

export function AgentChatCompactControls({
  isLoading,
  onClear,
  onStop,
}: AgentChatControlsProps) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-1 border-b px-3 py-2">
      <AgentChatActions
        isLoading={isLoading}
        onClear={onClear}
        onStop={onStop}
      />
    </div>
  )
}

function AgentChatActions({
  isLoading,
  onClear,
  onStop,
}: AgentChatControlsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {isLoading && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onStop}
          className="h-8 w-8"
          title="Stop generation"
        >
          <SquareIcon className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        className="h-8 w-8"
        title="Clear conversation"
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
