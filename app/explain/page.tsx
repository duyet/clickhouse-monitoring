'use client'

import {
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons'
import useSWR from 'swr'

import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { ErrorAlert } from '@/components/feedback'
import { ChartSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

const EXPLAIN_MODES = [
  { value: '', label: 'Plan' },
  { value: 'PIPELINE', label: 'Pipeline' },
  { value: 'AST', label: 'AST' },
  { value: 'SYNTAX', label: 'Syntax' },
  { value: 'ESTIMATE', label: 'Estimate' },
] as const

interface PlanSetting {
  key: string
  label: string
  description: string
  defaultValue: number
  group: 'common' | 'display' | 'advanced'
}

const PLAN_SETTINGS: PlanSetting[] = [
  {
    key: 'optimize',
    label: 'Optimize',
    description: 'Apply query plan optimizations before displaying',
    defaultValue: 1,
    group: 'common',
  },
  {
    key: 'description',
    label: 'Description',
    description: 'Print step description',
    defaultValue: 1,
    group: 'common',
  },
  {
    key: 'indexes',
    label: 'Indexes',
    description:
      'Show used indexes, filtered parts and granules (MergeTree only)',
    defaultValue: 1,
    group: 'common',
  },
  {
    key: 'projections',
    label: 'Projections',
    description: 'Show analyzed projections and part-level filtering effects',
    defaultValue: 0,
    group: 'common',
  },
  {
    key: 'actions',
    label: 'Actions',
    description: 'Print detailed information about step actions',
    defaultValue: 0,
    group: 'common',
  },
  {
    key: 'header',
    label: 'Header',
    description: 'Print output header for each step',
    defaultValue: 0,
    group: 'display',
  },
  {
    key: 'sorting',
    label: 'Sorting',
    description: 'Show sort description for steps that produce sorted output',
    defaultValue: 0,

    group: 'display',
  },
  {
    key: 'json',
    label: 'JSON',
    description: 'Output plan steps as JSON (recommended with TSVRaw format)',
    defaultValue: 0,

    group: 'display',
  },
  {
    key: 'distributed',
    label: 'Distributed',
    description:
      'Show query plans executed on remote nodes for distributed tables',
    defaultValue: 0,
    group: 'advanced',
  },
  {
    key: 'keep_logical_steps',
    label: 'Keep logical steps',
    description:
      'Keep logical plan steps for joins instead of converting to physical implementations',
    defaultValue: 0,
    group: 'advanced',
  },
]

const SETTING_GROUPS: { key: PlanSetting['group']; label: string }[] = [
  { key: 'common', label: 'Common' },
  { key: 'display', label: 'Display' },
  { key: 'advanced', label: 'Advanced' },
]

function buildDefaultSettings(): Record<string, number> {
  return Object.fromEntries(PLAN_SETTINGS.map((s) => [s.key, s.defaultValue]))
}

function serializeSettings(settings: Record<string, number>): string {
  return PLAN_SETTINGS.map((s) => `${s.key}=${settings[s.key]}`).join(',')
}

interface ExplainResult {
  explain: string
}

interface ApiResponse {
  data: ExplainResult[]
  metadata: { sql: string }
}

const fetcher = async (url: string): Promise<ApiResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const errorData = (await res.json()) as { error?: { message?: string } }
    throw new Error(errorData.error?.message || 'Failed to explain query')
  }
  return res.json() as Promise<ApiResponse>
}

function PlanSettingsPanel({
  settings,
  onToggle,
}: {
  settings: Record<string, number>
  onToggle: (key: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
      >
        {open ? (
          <ChevronDownIcon className="size-4" />
        ) : (
          <ChevronRightIcon className="size-4" />
        )}
        Plan Settings
      </button>

      {open && (
        <div className="bg-muted/50 space-y-4 rounded-md border p-4">
          {SETTING_GROUPS.map((group) => (
            <div key={group.key}>
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-3">
                {PLAN_SETTINGS.filter((s) => s.group === group.key).map(
                  (setting) => (
                    <div key={setting.key} className="flex items-start gap-2">
                      <Checkbox
                        id={`plan-${setting.key}`}
                        checked={settings[setting.key] === 1}
                        onCheckedChange={() => onToggle(setting.key)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`plan-${setting.key}`}
                        className="cursor-pointer leading-tight"
                      >
                        <span className="text-sm">{setting.label}</span>
                        <span className="text-muted-foreground block text-xs">
                          {setting.description}
                        </span>
                      </Label>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}

          <p className="text-muted-foreground text-xs">
            ClickHouse &gt;= v25.9: accurate index output requires{' '}
            <code className="bg-muted rounded px-1 text-[11px]">
              SETTINGS use_query_condition_cache = 0,
              use_skip_indexes_on_data_read = 0
            </code>{' '}
            appended to the query.
          </p>
        </div>
      )}
    </div>
  )
}

function ExplainContent() {
  const hostId = useHostId()
  const searchParams = useSearchParams()
  const queryFromUrl = searchParams.get('query') || ''

  const [queryInput, setQueryInput] = useState(queryFromUrl)
  const [queryToExplain, setQueryToExplain] = useState(queryFromUrl)
  const [mode, setMode] = useState('')
  const [planSettings, setPlanSettings] =
    useState<Record<string, number>>(buildDefaultSettings)

  const toggleSetting = useCallback((key: string) => {
    setPlanSettings((prev) => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1,
    }))
  }, [])

  const apiUrl = useMemo(() => {
    if (!queryToExplain) return null

    const params = new URLSearchParams()
    params.set('hostId', String(hostId))
    params.set('query', queryToExplain)
    if (mode) params.set('mode', mode)

    if (!mode) {
      const settingsStr = serializeSettings(planSettings)
      if (settingsStr) params.set('planSettings', settingsStr)
    }

    return `/api/v1/explain?${params.toString()}`
  }, [queryToExplain, hostId, mode, planSettings])

  const { data, error, isLoading } = useSWR<ApiResponse>(apiUrl, fetcher)

  const handleExplain = useCallback(() => {
    setQueryToExplain(queryInput)
  }, [queryInput])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleExplain()
      }
    },
    [handleExplain]
  )

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <InfoCircledIcon className="size-5" />
            Explain Query
            <a
              href="https://clickhouse.com/docs/sql-reference/statements/explain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground ml-auto text-xs font-normal"
            >
              Docs <ExternalLinkIcon className="inline size-3" />
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              {EXPLAIN_MODES.map((m) => (
                <TabsTrigger key={m.value} value={m.value}>
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {!mode && (
            <PlanSettingsPanel
              settings={planSettings}
              onToggle={toggleSetting}
            />
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Enter SQL query to explain..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Press Cmd/Ctrl + Enter to explain
              </p>
              <Button onClick={handleExplain} disabled={!queryInput.trim()}>
                Explain
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && <ChartSkeleton />}

      {error && (
        <ErrorAlert
          title="Failed to explain query"
          message={error instanceof Error ? error.message : String(error)}
        />
      )}

      {data?.data && data.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {mode ? `EXPLAIN ${mode}` : 'Execution Plan'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre
              className={cn(
                'bg-muted overflow-x-auto rounded-md p-4',
                'font-mono text-sm whitespace-pre-wrap'
              )}
            >
              {data.data.map((row) => row.explain).join('\n')}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ExplainPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ExplainContent />
    </Suspense>
  )
}
