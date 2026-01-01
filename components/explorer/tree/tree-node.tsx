'use client'

import { ChevronRight, Loader2 } from 'lucide-react'

import type { ComponentType } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface TreeNodeProps {
  label: string
  icon?: ComponentType<{ className?: string }>
  isExpanded?: boolean
  isSelected?: boolean
  isLoading?: boolean
  hasChildren?: boolean
  expandOnSelect?: boolean // If true, clicking label expands node (default: true for backwards compat)
  level: number
  badge?: React.ReactNode
  onToggle?: () => void
  onSelect?: () => void
  children?: React.ReactNode
}

export function TreeNode({
  label,
  icon: Icon,
  isExpanded = false,
  isSelected = false,
  isLoading = false,
  hasChildren = false,
  expandOnSelect = true,
  level,
  badge,
  onToggle,
  onSelect,
  children,
}: TreeNodeProps) {
  const paddingLeft = level * 16

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <SidebarMenuItem>
        <div
          className="flex items-center gap-1"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex size-4 items-center justify-center rounded-sm hover:bg-sidebar-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle?.()
                }}
              >
                {isLoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <ChevronRight
                    className={cn(
                      'size-3 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                )}
              </button>
            </CollapsibleTrigger>
          )}
          {!hasChildren && <div className="size-4" />}

          <SidebarMenuButton
            onClick={() => {
              // If expandOnSelect is true and has children and not expanded, expand first
              if (expandOnSelect && hasChildren && !isExpanded) {
                onToggle?.()
              }
              onSelect?.()
            }}
            isActive={isSelected}
            className="flex-1 justify-start"
          >
            {Icon && <Icon className="size-4 shrink-0" />}
            <span className="truncate">{label}</span>
            {badge && <div className="ml-auto">{badge}</div>}
          </SidebarMenuButton>
        </div>

        {hasChildren && children && (
          <CollapsibleContent>
            <SidebarMenuSub>{children}</SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}
