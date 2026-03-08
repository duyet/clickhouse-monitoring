'use client'

/**
 * SavedDashboardsToolbar
 *
 * Toolbar for managing saved dashboard configurations in localStorage.
 * Provides load, save, and delete operations via simple UI controls.
 */

import { BookmarkIcon, TrashIcon } from '@radix-ui/react-icons'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  deleteDashboard,
  listDashboards,
  loadDashboard,
  saveDashboard,
} from '@/lib/dashboard-storage'

interface SavedDashboardsToolbarProps {
  /** Currently selected chart names */
  selectedCharts: string[]
  /** Called when user loads a saved dashboard */
  onLoad: (charts: string[]) => void
}

export function SavedDashboardsToolbar({
  selectedCharts,
  onLoad,
}: SavedDashboardsToolbarProps) {
  const [savedNames, setSavedNames] = useState<string[]>([])
  const [activeName, setActiveName] = useState<string>('')

  // Refresh the list from localStorage (runs client-side only)
  const refreshList = useCallback(() => {
    setSavedNames(listDashboards())
  }, [])

  useEffect(() => {
    refreshList()
  }, [refreshList])

  function handleLoad(name: string) {
    const charts = loadDashboard(name)
    if (charts) {
      setActiveName(name)
      onLoad(charts)
    }
  }

  function handleSave() {
    if (selectedCharts.length === 0) {
      alert('Add at least one chart before saving.')
      return
    }
    const name = window.prompt('Dashboard name:')?.trim()
    if (!name) return
    saveDashboard(name, selectedCharts)
    setActiveName(name)
    refreshList()
  }

  function handleDelete() {
    if (!activeName) return
    if (!window.confirm(`Delete "${activeName}"?`)) return
    deleteDashboard(activeName)
    setActiveName('')
    refreshList()
  }

  return (
    <div className="flex flex-row items-center gap-2">
      <Select value={activeName} onValueChange={handleLoad}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Saved dashboards…" />
        </SelectTrigger>
        <SelectContent>
          {savedNames.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No saved dashboards
            </div>
          ) : (
            savedNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        title="Save current dashboard"
      >
        <BookmarkIcon className="mr-1 size-3" />
        Save
      </Button>

      {activeName && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          title={`Delete "${activeName}"`}
          className="text-destructive hover:text-destructive"
        >
          <TrashIcon className="mr-1 size-3" />
          Delete
        </Button>
      )}
    </div>
  )
}
