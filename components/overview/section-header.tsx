'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  icon?: ReactNode
  title: string
  className?: string
}

/**
 * SectionHeader - Lightweight header for bento grid sections
 * Following Vercel Geist pattern: icon + uppercase title
 *
 * Geist typography scale (4px base unit):
 * - 12px font (3 units) - labels, captions
 * - Uppercase with wider letter spacing (0.1em)
 * - Uses text-muted-foreground for secondary text (Geist standard)
 */
export function SectionHeader({ icon, title, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {icon && <span className="text-muted-foreground/70">{icon}</span>}
      <h3 className="text-xs uppercase tracking-[0.1em] font-medium text-muted-foreground">
        {title}
      </h3>
    </div>
  )
}
