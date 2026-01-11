'use client'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

interface SafeHoverCardProps {
  trigger: React.ReactNode
  children: React.ReactNode
}

export function SafeHoverCard({ trigger, children }: SafeHoverCardProps) {
  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger aria-label="Show details">
        {trigger as any}
      </HoverCardTrigger>
      <HoverCardContent role="tooltip">{children as any}</HoverCardContent>
    </HoverCard>
  )
}
