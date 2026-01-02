'use client'

import { FolderTree, MenuIcon } from 'lucide-react'

import { ExplorerContent } from './explorer-content'
import { ExplorerSidebar } from './explorer-sidebar'
import { useState } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/layout/resizable'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { useHostId } from '@/lib/swr'

export function ExplorerLayout() {
  const hostId = useHostId()
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        {/* Mobile Header with title and sidebar trigger */}
        <div
          data-role="explorer-header"
          className="flex items-center gap-3 border-b p-3"
        >
          <Button
            data-role="sidebar-trigger"
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <MenuIcon className="size-4" />
          </Button>
          <h2 className="text-lg font-semibold">Database Explorer</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <ExplorerContent />
        </div>
        <ExplorerSidebar
          hostId={hostId}
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />
      </div>
    )
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
        <ExplorerSidebar hostId={hostId} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={82}>
        <ExplorerContent />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
