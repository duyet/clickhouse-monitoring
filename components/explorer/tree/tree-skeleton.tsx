'use client'

import { SidebarMenu, SidebarMenuSkeleton } from '@/components/ui/sidebar'

export function TreeSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SidebarMenu>
      {Array.from({ length: count }).map((_, i) => (
        <SidebarMenuSkeleton key={i} showIcon />
      ))}
    </SidebarMenu>
  )
}
