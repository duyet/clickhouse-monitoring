/**
 * Settings Diff Page
 * Route: /(dashboard)/settings-diff
 *
 * Cross-host comparison of system.settings and system.merge_tree_settings.
 * Highlights rows where values differ across hosts (hasDiff=true).
 */

import { DownloadIcon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { pageOgHead } from '@/lib/og'
import { apiFetch } from '@/lib/swr/api-fetch'

// ── Types matching /api/v1/settings-diff response ────────────────────────────

type HostInfo = { id: number; name: string }

type DiffRowValue = { value: string; changed: number; defaultValue: string }

type DiffRow = {
  name: string
  table: 'settings' | 'merge_tree_settings'
  values: Record<number, DiffRowValue>
  hasDiff: boolean
  changedFromDefault: boolean
}

type SettingsDiffResponse = {
  success: boolean
  hosts: HostInfo[]
  rows: DiffRow[]
  error?: string
}

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function fetchSettingsDiff(): Promise<SettingsDiffResponse> {
  const res = await apiFetch('/api/v1/settings-diff')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { error?: string }).error ??
        `Request failed (${res.status} ${res.statusText})`
    )
  }
  return res.json()
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCsv(hosts: HostInfo[], rows: DiffRow[]) {
  const hostHeaders = hosts.map((h) => h.name)
  const defaultHeader = hosts.length > 0 ? 'Default' : ''
  const header = [
    'Name',
    'Table',
    defaultHeader,
    ...hostHeaders,
    'Has Diff',
    'Changed From Default',
  ]
    .filter(Boolean)
    .join(',')

  const lines = rows.map((row) => {
    const defaultValue =
      hosts.length > 0 ? (row.values[hosts[0].id]?.defaultValue ?? '') : ''
    const hostValues = hosts.map(
      (h) => `"${(row.values[h.id]?.value ?? '').replace(/"/g, '""')}"`
    )
    return [
      `"${row.name}"`,
      row.table,
      `"${defaultValue.replace(/"/g, '""')}"`,
      ...hostValues,
      row.hasDiff ? 'true' : 'false',
      row.changedFromDefault ? 'true' : 'false',
    ].join(',')
  })

  const csv = [header, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'settings-diff.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Page component ────────────────────────────────────────────────────────────

function SettingsDiffPage() {
  const [showDiffsOnly, setShowDiffsOnly] = useState(false)
  const [showChangedOnly, setShowChangedOnly] = useState(false)
  const [nameFilter, setNameFilter] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings-diff'],
    queryFn: fetchSettingsDiff,
    staleTime: 60_000,
  })

  // ── Derived state ─────────────────────────────────────────────────────────

  const hosts = data?.hosts ?? []

  const filteredRows = (data?.rows ?? []).filter((row) => {
    if (showDiffsOnly && !row.hasDiff) return false
    if (showChangedOnly && !row.changedFromDefault) return false
    if (
      nameFilter &&
      !row.name.toLowerCase().includes(nameFilter.toLowerCase())
    )
      return false
    return true
  })

  const diffCount = (data?.rows ?? []).filter((r) => r.hasDiff).length

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Settings Diff"
          description="Cross-host comparison of ClickHouse settings"
        />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading settings…
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error || !data?.success) {
    const message =
      error instanceof Error
        ? error.message
        : (data?.error ?? 'Failed to load settings diff')
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Settings Diff"
          description="Cross-host comparison of ClickHouse settings"
        />
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-destructive">{message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Settings Diff"
        description={
          hosts.length > 1
            ? `Comparing ${hosts.length} hosts — ${diffCount} setting${diffCount !== 1 ? 's' : ''} differ`
            : 'ClickHouse settings and merge tree settings'
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(hosts, filteredRows)}
            disabled={filteredRows.length === 0}
          >
            <DownloadIcon className="mr-2 h-3.5 w-3.5" />
            Export CSV
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Input
          placeholder="Filter by name…"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="h-8 w-full sm:w-64"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch checked={showDiffsOnly} onCheckedChange={setShowDiffsOnly} />
          Show diffs only
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch
            checked={showChangedOnly}
            onCheckedChange={setShowChangedOnly}
          />
          Show changed from default only
        </label>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-64 min-w-48">Name</TableHead>
                  <TableHead className="w-40">Table</TableHead>
                  <TableHead className="w-36 text-muted-foreground">
                    Default
                  </TableHead>
                  {hosts.map((host) => (
                    <TableHead key={host.id} className="w-36">
                      {host.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3 + hosts.length}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No settings match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const defaultValue =
                      hosts.length > 0
                        ? (row.values[hosts[0].id]?.defaultValue ?? '—')
                        : '—'
                    return (
                      <TableRow
                        key={`${row.table}::${row.name}`}
                        className={
                          row.hasDiff
                            ? 'bg-amber-50 dark:bg-amber-950/20'
                            : undefined
                        }
                      >
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            {row.name}
                            {row.changedFromDefault && (
                              <Badge
                                variant="outline"
                                className="shrink-0 border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400"
                              >
                                modified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.table === 'merge_tree_settings'
                            ? 'merge_tree'
                            : 'settings'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {defaultValue}
                        </TableCell>
                        {hosts.map((host) => {
                          const cell = row.values[host.id]
                          const isDifferent =
                            row.hasDiff &&
                            hosts.some(
                              (h) =>
                                h.id !== host.id &&
                                row.values[h.id]?.value !== cell?.value
                            )
                          return (
                            <TableCell
                              key={host.id}
                              className={`font-mono text-xs${isDifferent ? ' font-semibold text-amber-700 dark:text-amber-400' : ''}`}
                            >
                              {cell?.value ?? (
                                <span className="text-muted-foreground/50">
                                  n/a
                                </span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {filteredRows.length.toLocaleString()} row
        {filteredRows.length !== 1 ? 's' : ''}
        {filteredRows.length !== (data?.rows?.length ?? 0) &&
          ` (filtered from ${(data?.rows?.length ?? 0).toLocaleString()})`}
      </p>
    </div>
  )
}

export const Route = createFileRoute('/(dashboard)/settings-diff')({
  component: SettingsDiffPage,
  head: () => pageOgHead('settings-diff'),
})
