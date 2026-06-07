import { MenuIcon } from 'lucide-react'

import { ExplorerContent } from './explorer-content'
import { ExplorerSidebar } from './explorer-sidebar'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

const SIDEBAR_WIDTH_KEY = 'chm.explorer.sidebarWidth'
const MIN_SIDEBAR_WIDTH = 220
const MAX_SIDEBAR_WIDTH = 640
const DEFAULT_SIDEBAR_WIDTH = 320

function clampWidth(px: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, px))
}

/**
 * Drag-to-resize width for the desktop explorer sidebar, persisted to
 * localStorage. A plain `width` state + pointer listeners is used instead of
 * react-resizable-panels: the panel library relies on a ResizeObserver, and the
 * lazy-loaded CodeMirror editor inside the content pane already has a documented
 * history of ResizeObserver measure loops (the tab-switch freeze). Keeping the
 * resize purely state-driven sidesteps that class of bug entirely.
 */
function useSidebarWidth() {
  const [width, setWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const dragging = useRef(false)

  // Hydrate persisted width on mount (client-only; avoids SSR localStorage read).
  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_WIDTH_KEY)
    if (stored) {
      const parsed = Number(stored)
      if (!Number.isNaN(parsed)) setWidth(clampWidth(parsed))
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    const startX = e.clientX
    // Measure the live pane width so the drag tracks from wherever it is now,
    // independent of the `width` state (keeps this callback dependency-free).
    const startWidth =
      e.currentTarget.parentElement?.offsetWidth ?? DEFAULT_SIDEBAR_WIDTH

    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return
      setWidth(clampWidth(startWidth + (ev.clientX - startX)))
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      // Persist the final width using the functional setter to read latest value.
      setWidth((w) => {
        window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w))
        return w
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  return { width, onPointerDown }
}

export function ExplorerLayout() {
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { width, onPointerDown } = useSidebarWidth()

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
          <h2 className="text-lg font-semibold">Data Explorer</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <ExplorerContent />
        </div>
        <ExplorerSidebar
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div
        className="relative shrink-0 overflow-auto border-r"
        style={{ width }}
      >
        <ExplorerSidebar />
        {/* Drag handle — a 2px hit area on the right edge that widens on hover. */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuenow={Math.round(width)}
          aria-valuemin={MIN_SIDEBAR_WIDTH}
          aria-valuemax={MAX_SIDEBAR_WIDTH}
          onPointerDown={onPointerDown}
          className={cn(
            'absolute inset-y-0 right-0 z-20 w-1 cursor-col-resize touch-none',
            'bg-transparent transition-colors hover:bg-primary/40'
          )}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <ExplorerContent />
      </div>
    </div>
  )
}
