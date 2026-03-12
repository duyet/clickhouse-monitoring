'use client'

import { MessageSquare, Plus, Trash } from 'lucide-react'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  type Conversation,
  formatRelativeTime,
} from '@/lib/ai/agent/conversation-utils'

// Re-export full Conversation type for convenience
export type { Conversation }

// Simplified interface for display purposes (subset of full Conversation type)
export interface ConversationListItem {
  id: string
  title: string
  updatedAt: number
}

interface ConversationSwitcherProps {
  currentConversationId: string | null
  conversations: ConversationListItem[]
  onNew: () => void
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
}

export function ConversationSwitcher({
  currentConversationId,
  conversations,
  onNew,
  onSelect,
  onDelete,
}: ConversationSwitcherProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (id: string) => {
    onSelect(id)
    setOpen(false)
  }

  const handleNew = () => {
    onNew()
    setOpen(false)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent triggering selection
    if (onDelete) {
      // Optional: Add confirmation dialog here
      onDelete(id)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MessageSquare className="h-4 w-4" />
          <span className="sr-only">Switch conversation</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {/* New conversation */}
        <DropdownMenuItem onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          <span>New conversation</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Conversation list */}
        {conversations.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {conversations.map((conv) => (
              <DropdownMenuItem
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className="group flex items-center justify-between gap-2"
                data-active={conv.id === currentConversationId || undefined}
              >
                <span className="truncate flex-1">{conv.title}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(conv.updatedAt)}
                </span>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, conv.id)}
                  >
                    <Trash className="h-3 w-3" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
