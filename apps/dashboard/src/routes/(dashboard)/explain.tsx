import {
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { splitSqlStatements } from '@chm/sql-builder'
import { lazy, Suspense, useMemo, useState } from 'react'
import { ExplainResult } from '@/components/explain/explain-result'
import { ErrorAlert } from '@/components/feedback'
import { SaveFavoriteButton } from '@/components/query-favorites'
import { TableSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePathname, useRouter, useSearchParams } from '@/lib/next-compat'
import { useHostId } from '@/lib/swr'
import { apiFetch } from '@/lib/swr/api-fetch'

// CodeMirror is heavy and pulls in browser-only APIs — lazy-load it so it never
// blocks the route's initial render and stays out of the server bundle.
const SqlEditor = lazy(() =>
  import('@/components/explorer/sql-editor').then((m) => ({
    default: m.SqlEditor,
  }))
)

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
  const res = await apiFetch(url)
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
              <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
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

const VALID_MODE_VALUES: Set<string> = new Set(
  EXPLAIN_MODES.map((m) => m.value)
)

function modeFromParam(param: string | null): string {
  const upper = (param || '').toUpperCase()
  return VALID_MODE_VALUES.has(upper) ? upper : ''
}

/**
 * Run EXPLAIN for a single SQL statement and render its result. Used both for
 * the single-query case and for each tab when several `;`-separated queries are
 * submitted. The fetch only fires while this component is mounted, so tabbed
 * results are explained lazily (Radix unmounts inactive tab content).
 */
function SingleExplain({
  hostId,
  query,
  mode,
  planSettings,
  treeRenderable,
}: {
  hostId: number
  query: string
  mode: string
  planSettings: Record<string, number>
  treeRenderable: boolean
}) {
  const apiUrl = (() => {
    const params = new URLSearchParams()
    params.set('hostId', String(hostId))
    params.set('query', query)
    if (mode) params.set('mode', mode)

    if (!mode) {
      const settingsStr = serializeSettings(planSettings)
      if (settingsStr) params.set('planSettings', settingsStr)
    }

    return `/api/v1/explain?${params.toString()}`
  })()

  const { data, error, isLoading } = useQuery<ApiResponse>({
    queryKey: [apiUrl],
    queryFn: () => fetcher(apiUrl),
    enabled: Boolean(query),
  })

  if (isLoading) return <TableSkeleton rows={3} />

  if (error) {
    return (
      <ErrorAlert
        title="Failed to explain query"
        message={error instanceof Error ? error.message : String(error)}
      />
    )
  }

  if (data?.data && data.data.length > 0) {
    return (
      <ExplainResult
        title={mode ? `EXPLAIN ${mode}` : 'Execution Plan'}
        lines={data.data.map((row) => row.explain)}
        treeRenderable={treeRenderable}
      />
    )
  }

  if (data?.data?.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState
            variant="no-data"
            title="No plan to display"
            description="The query was explained successfully but returned no plan output. Try a different EXPLAIN mode or adjust the query."
          />
        </CardContent>
      </Card>
    )
  }

  return null
}

function EditorFallback() {
  return <Skeleton className="h-[120px] w-full rounded-md" />
}

function ExplainContent() {
  const hostId = useHostId()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryFromUrl = searchParams.get('query') || ''

  const [queryInput, setQueryInput] = useState(queryFromUrl)
  const [committedQuery, setCommittedQuery] = useState(queryFromUrl)
  const [mode, setModeState] = useState(() =>
    modeFromParam(searchParams.get('mode'))
  )
  const [planSettings, setPlanSettings] =
    useState<Record<string, number>>(buildDefaultSettings)
  const [activeQuery, setActiveQuery] = useState('0')

  const setMode = (newMode: string) => {
    setModeState(newMode)
    const params = new URLSearchParams(searchParams.toString())
    if (newMode) {
      params.set('mode', newMode.toLowerCase())
    } else {
      params.delete('mode')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const toggleSetting = (key: string) => {
    setPlanSettings((prev) => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1,
    }))
  }

  // Split the committed input on top-level `;` so several queries can be
  // explained at once, each in its own tab. The server also strips a trailing
  // FORMAT clause / semicolon, so `... FORMAT JSONEachRow` pasted from the SQL
  // console explains cleanly.
  const statements = useMemo(
    () => splitSqlStatements(committedQuery),
    [committedQuery]
  )

  // EXPLAIN PLAN (mode '') and PIPELINE return indent-nested text that renders
  // as a tree. AST/SYNTAX/ESTIMATE are flat or non-hierarchical, and the JSON
  // plan setting emits JSON rather than indented text — show text only there.
  const treeRenderable =
    (mode === '' || mode === 'PIPELINE') && planSettings.json !== 1

  const handleExplain = () => {
    setCommittedQuery(queryInput)
    setActiveQuery('0')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <InfoCircledIcon className="size-5" />
            Explain Query
            <div className="ml-auto flex items-center gap-2">
              <SaveFavoriteButton
                sql={committedQuery}
                hostId={hostId}
                database={null}
              />
              <a
                href="https://clickhouse.com/docs/sql-reference/statements/explain"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground text-xs font-normal"
              >
                Docs <ExternalLinkIcon className="inline size-3" />
              </a>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={setMode}>
            <div className="overflow-x-auto">
              <TabsList>
                {EXPLAIN_MODES.map((m) => (
                  <TabsTrigger key={m.value} value={m.value}>
                    {m.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {!mode && (
            <PlanSettingsPanel
              settings={planSettings}
              onToggle={toggleSetting}
            />
          )}

          <div className="space-y-2">
            <Suspense fallback={<EditorFallback />}>
              <SqlEditor
                value={queryInput}
                onChange={setQueryInput}
                onRun={handleExplain}
                placeholder="Enter SQL query to explain..."
              />
            </Suspense>
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">
                Press Cmd/Ctrl + Enter to explain. Separate multiple queries
                with{' '}
                <code className="bg-muted rounded px-1 text-[11px]">;</code>
              </p>
              <Button onClick={handleExplain} disabled={!queryInput.trim()}>
                Explain
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {statements.length > 1 ? (
        <Tabs value={activeQuery} onValueChange={setActiveQuery}>
          <div className="overflow-x-auto">
            <TabsList>
              {statements.map((_, i) => (
                <TabsTrigger key={i} value={String(i)}>
                  Query {i + 1}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {statements.map((stmt, i) => (
            <TabsContent key={i} value={String(i)} className="mt-4">
              <SingleExplain
                hostId={hostId}
                query={stmt}
                mode={mode}
                planSettings={planSettings}
                treeRenderable={treeRenderable}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : statements.length === 1 ? (
        <SingleExplain
          hostId={hostId}
          query={statements[0]}
          mode={mode}
          planSettings={planSettings}
          treeRenderable={treeRenderable}
        />
      ) : null}
    </div>
  )
}

function ExplainPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={3} />}>
      <ExplainContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/explain')({
  component: ExplainPage,
})
