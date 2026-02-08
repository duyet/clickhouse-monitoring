'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  icon?: ReactNode
  title: string
  className?: string
}

/**
 * SectionHeader - Lightweight header for bento grid sections
 * Following Vercel dashboard pattern: icon + uppercase title
 * No card styling, just subtle text with optional icon
 */
export function SectionHeader({ icon, title, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {icon && <span className="text-foreground/50">{icon}</span>}
      <h3 className="text-[10px] uppercase tracking-wider font-medium text-foreground/60">
        {title}
      </h3>
    </div>
  )
}
