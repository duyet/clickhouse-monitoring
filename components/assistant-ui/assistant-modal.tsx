'use client'

/**
 * Floating chat bubble — assistant-ui `AssistantModal`. Mounted app-wide so the
 * ClickHouse agent is reachable from any dashboard page (see
 * `global-assistant-modal.tsx`).
 */

import { BotIcon, XIcon } from 'lucide-react'

import { Thread } from './thread'
import { AssistantModalPrimitive } from '@assistant-ui/react'
import { forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AssistantModal() {
  return (
    <AssistantModalPrimitive.Root>
      <AssistantModalPrimitive.Anchor className="fixed right-4 bottom-4 z-40 size-11">
        <AssistantModalPrimitive.Trigger asChild>
          <AssistantModalButton />
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>

      <AssistantModalPrimitive.Content
        sideOffset={16}
        className={cn(
          'bg-popover text-popover-foreground z-50 flex h-[34rem] max-h-[80vh] w-[26rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          '[&>.aui-root]:rounded-none [&>.aui-root]:border-0'
        )}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <BotIcon className="text-primary size-4" />
          <span className="text-sm font-medium">ClickHouse Agent</span>
        </div>
        <div className="min-h-0 flex-1">
          <Thread />
        </div>
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  )
}

type ButtonProps = React.ComponentPropsWithoutRef<typeof Button>

const AssistantModalButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { 'data-state': state, ...rest }: ButtonProps & { 'data-state'?: string },
    ref
  ) => {
    const open = state === 'open'
    return (
      <Button
        {...rest}
        ref={ref}
        size="icon"
        aria-label={open ? 'Close agent' : 'Open agent'}
        className="size-11 rounded-full shadow-lg transition-transform hover:scale-105"
      >
        <span
          className={cn(
            'absolute transition-all',
            open ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
          )}
        >
          <BotIcon className="size-5" />
        </span>
        <span
          className={cn(
            'absolute transition-all',
            open ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
          )}
        >
          <XIcon className="size-5" />
        </span>
      </Button>
    )
  }
)
AssistantModalButton.displayName = 'AssistantModalButton'
