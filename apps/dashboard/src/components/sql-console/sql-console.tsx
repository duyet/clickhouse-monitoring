import {
  CheckCircle2,
  Clock,
  History,
  Loader2,
  Play,
  Sparkles,
  X,
} from 'lucide-react'

import { useQueryHistory } from './hooks/use-query-history'
import { useSqlRunner } from './hooks/use-sql-runner'
import { QueryHistoryPanel } from './query-history-panel'
import { AnalysisTab } from './tabs/analysis-tab'
import { ExplainTab } from './tabs/explain-tab'
import { QueryLogTab } from './tabs/query-log-tab'
import { ResultsTab } from './tabs/results-tab'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ClientOnly } from '@/components/client-only'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatSql } from '@/lib/sql-format'

// CodeMirror lives here, ALWAYS mounted and visible at the top of the console —
// never inside the result Tabs and never hidden via display:none. That is the
// structural fix for the tab-switch freeze (CM's ResizeObserver loops on a 0×0
// box). See sql-console-rebuild memory note.
const SqlEditor = lazy(() =>
  import('@/components/explorer/sql-editor').then((m) => ({
    default: m.SqlEditor,
  }))
)

export interface SqlConsoleProps {
  hostId: number
  /** Seed the editor (e.g. from URL ?q= or a selected table). */
  initialSql?: string
  /** Layout hint: 'page' fills the viewport; 'embedded' fills its container. */
  variant?: 'page' | 'embedded'
  /** Called when the committed query changes, e.g. to sync the URL. */
  onQueryCommitted?: (sql: string) => void
}

type ResultTabValue = 'results' | 'explain' | 'query-log' | 'analysis'

export function SqlConsole({
  hostId,
  initialSql = '',
  variant = 'page',
  onQueryCommitted,
}: SqlConsoleProps) {
  const runner = useSqlRunner(hostId, initialSql)
  const history = useQueryHistory()
  const [tab, setTab] = useState<ResultTabValue>('results')
  const [historyOpen, setHistoryOpen] = useState(false)

  const {
    editorValue,
    setEditorValue,
    committedSql,
    run,
    cancel,
    result,
    error,
    isRunning,
    hasRun,
  } = runner

  // Log each completed run to local history exactly once (on the running→idle
  // transition for the current committed query).
  const wasRunning = useRef(false)
  useEffect(() => {
    if (wasRunning.current && !isRunning && committedSql) {
      history.add({
        sql: committedSql,
        hostId,
        database: null,
        ok: !error,
        rows: result?.rowCount,
        durationMs: result?.durationMs,
      })
    }
    wasRunning.current = isRunning
  }, [isRunning, committedSql, error, result, hostId, history])

  // Notify parent when the committed query changes (URL sync, etc.).
  useEffect(() => {
    if (committedSql) onQueryCommitted?.(committedSql)
  }, [committedSql, onQueryCommitted])

  const handleRun = (sql?: string) => run(sql)

  const handleFormat = async () => {
    // formatSql falls back to the dedented original on failure, so an invalid
    // query is left untouched rather than throwing.
    const formatted = await formatSql(editorValue, {
      language: 'sql',
      keywordCase: 'upper',
      // Preserve the editor's prior behavior (sql-formatter library defaults)
      // rather than the dialog-oriented helper defaults.
      identifierCase: 'preserve',
      tabWidth: 2,
      linesBetweenQueries: 1,
    })
    setEditorValue(formatted)
  }

  const handleSelectHistory = (sql: string, runIt = false) => {
    setEditorValue(sql)
    setHistoryOpen(false)
    if (runIt) run(sql)
  }

  const queryId = result?.queryId ?? null

  return (
    <div
      className={
        variant === 'page'
          ? 'flex h-full min-h-0 flex-col gap-3'
          : 'flex min-h-0 flex-col gap-3'
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleRun()}
            disabled={!editorValue.trim()}
          >
            {isRunning ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Play className="mr-1.5 size-3.5" />
            )}
            Run
            <kbd className="bg-primary-foreground/20 ml-1.5 hidden rounded px-1 text-[10px] sm:inline">
              ⌘↵
            </kbd>
          </Button>
          {isRunning && (
            <Button size="sm" variant="destructive" onClick={cancel}>
              <X className="mr-1.5 size-3.5" /> Cancel
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleFormat}
            disabled={!editorValue.trim()}
          >
            <Sparkles className="mr-1.5 size-3.5" /> Format
          </Button>
        </div>

        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline">
              <History className="mr-1.5 size-3.5" /> History
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex w-[380px] flex-col p-0 sm:w-[440px]"
          >
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Query history</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1">
              <QueryHistoryPanel
                hostId={hostId}
                entries={history.entries}
                onSelect={handleSelectHistory}
                onRemove={history.remove}
                onTogglePin={history.togglePin}
                onClear={history.clear}
                serverEnabled={historyOpen}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Editor — always mounted & visible */}
      <ClientOnly fallback={<Skeleton className="h-[160px] rounded-md" />}>
        <Suspense fallback={<Skeleton className="h-[160px] rounded-md" />}>
          <SqlEditor
            value={editorValue}
            onChange={setEditorValue}
            onRun={() => handleRun()}
            placeholder="SELECT * FROM system.tables LIMIT 100"
          />
        </Suspense>
      </ClientOnly>

      {/* Status bar */}
      <StatusBar
        isRunning={isRunning}
        hasRun={hasRun}
        rows={result?.rowCount}
        durationMs={result?.durationMs}
        queryId={queryId}
        hasError={Boolean(error)}
      />

      {/* Result tabs — no CodeMirror inside, safe to hide/show */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ResultTabValue)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="explain">EXPLAIN</TabsTrigger>
          <TabsTrigger value="query-log">Query Log</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <ScrollArea className="mt-3 min-h-0 flex-1">
          <TabsContent value="results" className="mt-0">
            <ResultsTab
              result={result}
              error={error}
              isRunning={isRunning}
              hasRun={hasRun}
            />
          </TabsContent>
          <TabsContent value="explain" className="mt-0">
            <ExplainTab
              hostId={hostId}
              sql={committedSql}
              active={tab === 'explain'}
            />
          </TabsContent>
          <TabsContent value="query-log" className="mt-0">
            <QueryLogTab
              hostId={hostId}
              queryId={queryId}
              active={tab === 'query-log'}
            />
          </TabsContent>
          <TabsContent value="analysis" className="mt-0">
            <AnalysisTab
              hostId={hostId}
              sql={committedSql}
              queryId={queryId}
              active={tab === 'analysis'}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

function StatusBar({
  isRunning,
  hasRun,
  rows,
  durationMs,
  queryId,
  hasError,
}: {
  isRunning: boolean
  hasRun: boolean
  rows?: number
  durationMs?: number
  queryId: string | null
  hasError: boolean
}) {
  if (!hasRun) return null
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
      {isRunning ? (
        <span className="flex items-center gap-1.5">
          <Loader2 className="size-3 animate-spin" /> Running…
        </span>
      ) : hasError ? (
        <Badge variant="destructive" className="text-xs">
          Error
        </Badge>
      ) : (
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3" /> Success
        </span>
      )}
      {!isRunning && !hasError && rows !== undefined && (
        <span>{rows.toLocaleString()} rows</span>
      )}
      {!isRunning && durationMs !== undefined && (
        <span className="flex items-center gap-1">
          <Clock className="size-3" /> {durationMs} ms
        </span>
      )}
      {queryId && (
        <code className="text-[11px] opacity-70" title={queryId}>
          {queryId.slice(0, 8)}…
        </code>
      )}
    </div>
  )
}
