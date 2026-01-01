'use client'

import { MenuIcon } from 'lucide-react'

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
        <div className="border-b p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <MenuIcon className="size-4" />
          </Button>
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
