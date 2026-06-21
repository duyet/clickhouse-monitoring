'use client'

/**
 * AI Insights settings form — compact, icon-driven, template-first.
 *
 * Per-user insight preferences persisted by `useInsightsSettings`: enrichment,
 * model, prompt tone, and lookback window. Operators can one-click a template
 * (Quick scan / Deep dive / Learning / Raw) or fine-tune the individual
 * controls. The available model list comes from the same source as the agent
 * model picker (configured providers only). Changes apply immediately.
 */

import {
  Activity,
  AlertTriangle,
  Clock,
  Cpu,
  FileText,
  GraduationCap,
  type LucideIcon,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  type ModelDisplayInfo,
  useAgentModel,
} from '@/lib/hooks/use-agent-model'
import {
  INSIGHT_PROMPT_STYLES,
  type InsightPromptStyle,
} from '@/lib/insights/prompts'
import { INSIGHT_WINDOWS } from '@/lib/insights/settings'
import {
  INSIGHT_TEMPLATES,
  type InsightTemplate,
  matchTemplate,
} from '@/lib/insights/templates'
import { useInsightsSettings } from '@/lib/query/use-insights-settings'
import { apiFetch } from '@/lib/swr/api-fetch'
import { cn } from '@/lib/utils'

const DEFAULT_MODEL_VALUE = '__default__'

interface InsightsStatus {
  enrichmentAvailable: boolean
  defaultModel: string
}

const TEMPLATE_ICONS: Record<InsightTemplate['icon'], LucideIcon> = {
  Zap,
  FileText,
  GraduationCap,
  Activity,
}

const STYLE_ICONS: Record<InsightPromptStyle, LucideIcon> = {
  concise: Zap,
  detailed: FileText,
  beginner: GraduationCap,
}

export function InsightsSettingsForm({ className }: { className?: string }) {
  const { settings, update, reset } = useInsightsSettings()
  const { models } = useAgentModel()

  const { data: status } = useQuery<InsightsStatus>({
    queryKey: ['/api/v1/insights/status'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/insights/status')
      if (!res.ok) throw new Error('Failed to fetch insights status')
      return res.json()
    },
    staleTime: 5 * 60_000,
    retry: 1,
  })
  const enrichmentUnavailable =
    settings.enrich && status?.enrichmentAvailable === false

  const grouped = new Map<string, ModelDisplayInfo[]>()
  for (const m of models) {
    const list = grouped.get(m.provider) ?? []
    list.push(m)
    grouped.set(m.provider, list)
  }

  const off = !settings.enrich
  const activeTemplate = matchTemplate(settings)

  return (
    <Card className={cn(className)}>
      <CardContent className="space-y-5 pt-6">
        {/* Templates — pick a vibe in one click */}
        <div className="space-y-2">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Templates
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {INSIGHT_TEMPLATES.map((t) => {
              const Icon = TEMPLATE_ICONS[t.icon]
              const active = activeTemplate === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update(t.settings)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors',
                    active
                      ? 'border-sky-500/50 bg-sky-500/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4',
                      active
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-sm font-medium leading-none">
                    {t.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {t.hint}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Enhance with AI */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sky-500/10">
              <Sparkles className="size-4 text-sky-500" />
            </span>
            <div className="leading-tight">
              <Label htmlFor="insights-enrich" className="text-sm font-medium">
                Enhance with AI
              </Label>
              <p className="text-xs text-muted-foreground">
                Rewrite signals into clear, actionable insights.
              </p>
            </div>
          </div>
          <Switch
            id="insights-enrich"
            checked={settings.enrich}
            onCheckedChange={(checked) => update({ enrich: checked })}
          />
        </div>

        {enrichmentUnavailable ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>
              No LLM provider configured — deterministic copy will be shown. Set
              a provider key (e.g. <code>OPENROUTER_API_KEY</code>).
            </span>
          </div>
        ) : null}

        {/* Prompt style — segmented icon control */}
        <div
          className={cn('space-y-2', off && 'pointer-events-none opacity-50')}
        >
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <FileText className="size-3.5 text-muted-foreground" />
            Prompt style
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {INSIGHT_PROMPT_STYLES.map((s) => {
              const Icon = STYLE_ICONS[s.id]
              const active = settings.promptStyle === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={off}
                  onClick={() => update({ promptStyle: s.id })}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center transition-colors',
                    active
                      ? 'border-sky-500/50 bg-sky-500/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4',
                      active
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-xs font-medium">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Model + Window — 2-col grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div
            className={cn(
              'space-y-1.5',
              off && 'pointer-events-none opacity-50'
            )}
          >
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Cpu className="size-3.5 text-muted-foreground" />
              Model
            </Label>
            <Select
              value={settings.model ?? DEFAULT_MODEL_VALUE}
              onValueChange={(value) =>
                update({ model: value === DEFAULT_MODEL_VALUE ? null : value })
              }
              disabled={off}
            >
              <SelectTrigger className="w-full" aria-label="Model">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_MODEL_VALUE}>
                  Default
                  {status?.defaultModel ? (
                    <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                      {status.defaultModel}
                    </span>
                  ) : null}
                </SelectItem>
                {Array.from(grouped.entries()).map(([provider, list]) => (
                  <SelectGroup key={provider}>
                    <SelectLabel className="capitalize">{provider}</SelectLabel>
                    {list.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="font-mono text-xs">{m.name}</span>
                        {m.isFree ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {' '}
                            · free
                          </span>
                        ) : null}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="size-3.5 text-muted-foreground" />
              Lookback
            </Label>
            <Select
              value={settings.window}
              onValueChange={(value) => update({ window: value })}
            >
              <SelectTrigger className="w-full" aria-label="Lookback window">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSIGHT_WINDOWS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            onClick={reset}
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
