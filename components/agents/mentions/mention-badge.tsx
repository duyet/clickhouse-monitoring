'use client'

import { X } from 'lucide-react'

import type { Mention, SlashCommand } from './types'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MentionBadgeProps {
  mention: Mention
  onRemove: (id: string) => void
}

const TYPE_CLASSES: Record<Mention['type'], string> = {
  table:
    'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50',
  resource:
    'border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50',
  skill:
    'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50',
}

export function MentionBadge({ mention, onRemove }: MentionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 py-0.5 pl-2 pr-1 text-xs font-medium',
        TYPE_CLASSES[mention.type]
      )}
    >
      <span>@{mention.label}</span>
      <button
        type="button"
        aria-label={`Remove ${mention.label} mention`}
        onClick={() => onRemove(mention.id)}
        className="ml-0.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

interface SlashCommandBadgeProps {
  command: SlashCommand
  onRemove: () => void
}

export function SlashCommandBadge({
  command,
  onRemove,
}: SlashCommandBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 py-0.5 pl-2 pr-1 text-xs font-medium',
        'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
      )}
    >
      <span>{command.label}</span>
      <button
        type="button"
        aria-label={`Remove ${command.label} command`}
        onClick={onRemove}
        className="ml-0.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}
