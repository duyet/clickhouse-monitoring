'use client'

import { DatabaseTree } from './tree/database-tree'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
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
      <SidebarHeader>
        <h2 className="px-2 text-lg font-semibold">Database Explorer</h2>
      </SidebarHeader>
      <SidebarContent>
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

  return <div className="flex h-full flex-col border-r">{content}</div>
}
