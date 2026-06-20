'use client'

/**
 * AI Insights settings form.
 *
 * Self-contained controls for the per-user insight preferences persisted by
 * `useInsightsSettings`: enrichment on/off, which model enriches, the prompt
 * tone, and the panel's read window. The available model list is read from the
 * same source as the agent model picker (`/api/v1/agents/models`, configured
 * providers only). Changes apply immediately — the overview panel reflects the
 * new settings on its next refresh.
 */

import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  type ModelDisplayInfo,
  useAgentModel,
} from '@/lib/hooks/use-agent-model'
import {
  INSIGHT_PROMPT_STYLES,
  resolvePromptStyle,
} from '@/lib/insights/prompts'
import { INSIGHT_WINDOWS } from '@/lib/insights/settings'
import { useInsightsSettings } from '@/lib/query/use-insights-settings'
import { apiFetch } from '@/lib/swr/api-fetch'
import { cn } from '@/lib/utils'

const DEFAULT_MODEL_VALUE = '__default__'

interface InsightsStatus {
  enrichmentAvailable: boolean
  defaultModel: string
}

export function InsightsSettingsForm({ className }: { className?: string }) {
  const { settings, update, reset } = useInsightsSettings()
  const { models } = useAgentModel()

  // Whether LLM enrichment is actually configured on this deployment, so the
  // "Enhance with AI" toggle doesn't silently no-op on a key-less install.
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

  // Group available models by provider for the dropdown.
  const grouped = new Map<string, ModelDisplayInfo[]>()
  for (const m of models) {
    const list = grouped.get(m.provider) ?? []
    list.push(m)
    grouped.set(m.provider, list)
  }

  const enrichDisabled = !settings.enrich
  const activeStyle = resolvePromptStyle(settings.promptStyle)

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-sky-500" />
          AI Insights
        </CardTitle>
        <CardDescription>
          Tune how cluster insights are generated and how far back the overview
          panel looks. Settings are stored in this browser.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enrichment toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="insights-enrich" className="text-sm font-medium">
              Enhance with AI
            </Label>
            <p className="text-muted-foreground text-sm">
              Rewrite raw monitoring signals into clearer, actionable insights.
              When off, the original deterministic copy is shown.
            </p>
          </div>
          <Switch
            id="insights-enrich"
            checked={settings.enrich}
            onCheckedChange={(checked) => update({ enrich: checked })}
          />
        </div>

        {enrichmentUnavailable ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              No LLM provider is configured on this deployment, so enrichment is
              unavailable — the original deterministic copy will be shown. Set a
              provider API key (e.g. <code>OPENROUTER_API_KEY</code>) to enable
              it.
            </span>
          </div>
        ) : null}

        <Separator />

        {/* Model */}
        <div
          className={cn(
            'space-y-2 transition-opacity',
            enrichDisabled && 'pointer-events-none opacity-50'
          )}
        >
          <Label className="text-sm font-medium">Model</Label>
          <p className="text-muted-foreground text-sm">
            Which model writes the insights. “Deployment default” uses the
            server-configured model
            {status?.defaultModel ? (
              <>
                {' '}
                (
                <code className="font-mono text-xs">{status.defaultModel}</code>
                )
              </>
            ) : null}
            .
          </p>
          <Select
            value={settings.model ?? DEFAULT_MODEL_VALUE}
            onValueChange={(value) =>
              update({ model: value === DEFAULT_MODEL_VALUE ? null : value })
            }
            disabled={enrichDisabled}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Deployment default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_MODEL_VALUE}>
                Deployment default
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

        {/* Prompt style */}
        <div
          className={cn(
            'space-y-2 transition-opacity',
            enrichDisabled && 'pointer-events-none opacity-50'
          )}
        >
          <Label className="text-sm font-medium">Prompt style</Label>
          <p className="text-muted-foreground text-sm">
            {activeStyle.description}
          </p>
          <Select
            value={settings.promptStyle}
            onValueChange={(value) =>
              update({ promptStyle: value as typeof settings.promptStyle })
            }
            disabled={enrichDisabled}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSIGHT_PROMPT_STYLES.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Read window */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Lookback window</Label>
          <p className="text-muted-foreground text-sm">
            How far back the overview panel reads insights before they age out.
          </p>
          <Select
            value={settings.window}
            onValueChange={(value) => update({ window: value })}
          >
            <SelectTrigger className="w-full max-w-md">
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

        <Separator />

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={reset}
          >
            <RotateCcw className="size-3.5" />
            Reset to defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
