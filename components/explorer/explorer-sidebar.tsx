'use client'

import { DatabaseTree } from './tree/database-tree'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'

interface ExplorerSidebarProps {
  hostId: number
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ExplorerSidebar({
  hostId,
  isOpen,
  onOpenChange,
}: ExplorerSidebarProps) {
  const isMobile = useIsMobile()

  const content = (
    <>
      <SidebarContent
        data-role="explorer-sidebar-content"
        className="overflow-y-auto px-2 pb-4"
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <DatabaseTree hostId={hostId} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex h-full flex-col">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      data-role="explorer-sidebar"
      className="flex h-full flex-col border-r"
    >
      {content}
    </div>
  )
}
