'use client'

/**
 * AI Insights settings form — template-first, searchable model picker.
 *
 * Per-user insight preferences persisted by `useInsightsSettings`: enrichment,
 * model, prompt tone, and lookback window. Operators can one-click a template
 * (Quick scan / Deep dive / Learning / Raw) or fine-tune the individual
 * controls. The available model list comes from the same source as the agent
 * model picker (configured providers only). Changes apply immediately.
 */

import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock,
  Cpu,
  ExternalLink,
  FileText,
  GraduationCap,
  type LucideIcon,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { useState } from 'react'
import {
  AlibabaIcon,
  AmazonBedrockIcon,
  AnthropicIcon,
  AnyRouterIcon,
  AzureIcon,
  BasetenIcon,
  CerebrasIcon,
  CloudflareIcon,
  DeepInfraIcon,
  DeepSeekIcon,
  FastRouterIcon,
  FireworksAIIcon,
  GitHubCopilotIcon,
  GoogleIcon,
  GroqIcon,
  HuggingFaceIcon,
  LMStudioIcon,
  MetaIcon,
  MistralIcon,
  MonogramProviderIcon,
  MoonshotIcon,
  NebiusIcon,
  NvidiaIcon,
  OpenAIIcon,
  OpenCodeIcon,
  OpenRouterIcon,
  PerplexityIcon,
  ReplicateIcon,
  ScaleWayIcon,
  TogetherAIIcon,
  UnknownProviderIcon,
  UpstageIcon,
  V0Icon,
  VeniceIcon,
  VercelIcon,
  VertexAIIcon,
  VultrIcon,
  WandbIcon,
  XAIIcon,
  ZAIIcon,
  ZhipuAIIcon,
} from '@/components/icons/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { docsSiteUrl } from '@/lib/docs-site'
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

const STYLE_ICONS: Record<InsightPromptStyle, LucideIcon> = {
  concise: Zap,
  detailed: FileText,
  beginner: GraduationCap,
}

// ── Provider icon map ────────────────────────────────────────────────────────

type ProviderIconComponent = React.ComponentType<{
  className?: string
  size?: number
}>

const PROVIDER_ICONS: Record<string, ProviderIconComponent> = {
  anyrouter: AnyRouterIcon,
  openrouter: OpenRouterIcon,
  openai: OpenAIIcon,
  anthropic: AnthropicIcon,
  google: GoogleIcon,
  nvidia: NvidiaIcon,
  mistral: MistralIcon,
  perplexity: PerplexityIcon,
  deepinfra: DeepInfraIcon,
  'fireworks-ai': FireworksAIIcon,
  fireworks: FireworksAIIcon,
  deepseek: DeepSeekIcon,
  groq: GroqIcon,
  togetherai: TogetherAIIcon,
  vercel: VercelIcon,
  xai: XAIIcon,
  huggingface: HuggingFaceIcon,
  meta: MetaIcon,
  llama: MetaIcon,
  azure: AzureIcon,
  cerebras: CerebrasIcon,
  replicate: ReplicateIcon,
  'github-copilot': GitHubCopilotIcon,
  'github-models': GitHubCopilotIcon,
  'cloudflare-workers-ai': CloudflareIcon,
  cloudflare: CloudflareIcon,
  v0: V0Icon,
  'amazon-bedrock': AmazonBedrockIcon,
  amazonbedrock: AmazonBedrockIcon,
  scaleway: ScaleWayIcon,
  nebius: NebiusIcon,
  vultr: VultrIcon,
  upstage: UpstageIcon,
  alibaba: AlibabaIcon,
  'alibaba-cn': AlibabaIcon,
  moonshotai: MoonshotIcon,
  'moonshotai-cn': MoonshotIcon,
  zhipuai: ZhipuAIIcon,
  'zhipuai-coding-plan': ZhipuAIIcon,
  zai: ZAIIcon,
  'zai-coding-plan': ZAIIcon,
  fastrouter: FastRouterIcon,
  wandb: WandbIcon,
  opencode: OpenCodeIcon,
  'google-vertex': VertexAIIcon,
  'google-vertex-anthropic': VertexAIIcon,
  lmstudio: LMStudioIcon,
  baseten: BasetenIcon,
  venice: VeniceIcon,
}

function ProviderIcon({
  provider,
  className,
  size = 13,
}: {
  provider: string
  className?: string
  size?: number
}) {
  const key = provider.toLowerCase().replace(/[-_\s]/g, '')
  const Icon =
    PROVIDER_ICONS[key] ??
    PROVIDER_ICONS[provider.toLowerCase()] ??
    UnknownProviderIcon

  if (Icon === UnknownProviderIcon) {
    return (
      <MonogramProviderIcon
        provider={provider}
        className={className}
        size={size}
      />
    )
  }

  return <Icon className={className} size={size} />
}

// ── Searchable model combobox ────────────────────────────────────────────────

function ModelCombobox({
  value,
  models,
  defaultModelLabel,
  disabled,
  onValueChange,
}: {
  value: string | null
  models: readonly ModelDisplayInfo[]
  defaultModelLabel: string | undefined
  disabled?: boolean
  onValueChange: (value: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Group by provider; preserve the provider ordering from the models array.
  const grouped = new Map<string, ModelDisplayInfo[]>()
  for (const m of models) {
    const list = grouped.get(m.provider) ?? []
    list.push(m)
    grouped.set(m.provider, list)
  }

  // Filter across all models when the user searches.
  const needle = search.toLowerCase()
  const filteredGroups: Array<[string, ModelDisplayInfo[]]> = Array.from(
    grouped.entries()
  )
    .map(([provider, list]): [string, ModelDisplayInfo[]] => [
      provider,
      list.filter(
        (m) =>
          !needle ||
          m.name.toLowerCase().includes(needle) ||
          m.provider.toLowerCase().includes(needle) ||
          m.id.toLowerCase().includes(needle)
      ),
    ])
    .filter(([, list]) => list.length > 0)

  const defaultMatches =
    !needle ||
    'default'.includes(needle) ||
    (defaultModelLabel?.toLowerCase() ?? '').includes(needle)

  const currentModel = value ? models.find((m) => m.id === value) : null

  const triggerLabel = currentModel ? currentModel.name : 'Default'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Model"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:bg-accent/40 transition-colors'
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {currentModel ? (
              <>
                <ProviderIcon
                  provider={currentModel.provider}
                  className="shrink-0 text-muted-foreground"
                />
                <span className="truncate font-mono text-xs">
                  {triggerLabel}
                </span>
                {currentModel.isFree && (
                  <span className="shrink-0 rounded px-1 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    free
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{triggerLabel}</span>
            )}
          </span>
          <ChevronDown className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search models…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-64">
            <CommandEmpty>No models found.</CommandEmpty>

            {/* Default option */}
            {defaultMatches && (
              <CommandGroup>
                <CommandItem
                  value={DEFAULT_MODEL_VALUE}
                  onSelect={() => {
                    onValueChange(null)
                    setOpen(false)
                    setSearch('')
                  }}
                  className="gap-2"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {value === null && <Check className="size-3" />}
                  </span>
                  <span className="flex-1">
                    <span className="text-sm">Default</span>
                    {defaultModelLabel && (
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                        {defaultModelLabel}
                      </span>
                    )}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            {filteredGroups.map(([provider, list], idx) => (
              <span key={provider}>
                {(defaultMatches || idx > 0) && <CommandSeparator />}
                <CommandGroup
                  heading={
                    <span className="flex items-center gap-1.5">
                      <ProviderIcon
                        provider={provider}
                        className="text-muted-foreground"
                        size={11}
                      />
                      <span className="capitalize">{provider}</span>
                    </span>
                  }
                >
                  {list.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={m.id}
                      onSelect={() => {
                        onValueChange(m.id)
                        setOpen(false)
                        setSearch('')
                      }}
                      className="gap-2"
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        {value === m.id && <Check className="size-3" />}
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        <ProviderIcon
                          provider={m.provider}
                          className="shrink-0 text-muted-foreground"
                        />
                        <span className="truncate font-mono text-xs">
                          {m.name}
                        </span>
                        {m.isFree && (
                          <span className="ml-auto shrink-0 rounded px-1 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            free
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </span>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ── Inline SVG glyph used in the "Enhance with AI" row ──────────────────────

function EnhanceGlyph({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <line
        x1="8"
        y1="1"
        x2="8"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="12"
        x2="8"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="8"
        x2="4"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="8"
        x2="15"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="3"
        x2="5.5"
        y2="5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="10.5"
        y1="10.5"
        x2="13"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="13"
        y1="3"
        x2="10.5"
        y2="5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="5.5"
        y1="10.5"
        x2="3"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8" r="1.75" fill="currentColor" />
    </svg>
  )
}

// ── Template SVG icons (inline, no lucide dep) ───────────────────────────────

const TEMPLATE_SVG: Record<
  InsightTemplate['icon'],
  React.ComponentType<{ className?: string }>
> = {
  Zap: ({ className }) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8.5 1.5L3 8H7L5.5 12.5L11 6H7L8.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  ),
  FileText: ({ className }) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2.5"
        y="1.5"
        width="9"
        height="11"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line
        x1="4.5"
        y1="5"
        x2="9.5"
        y2="5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="4.5"
        y1="7.5"
        x2="9.5"
        y2="7.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="4.5"
        y1="10"
        x2="7.5"
        y2="10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  GraduationCap: ({ className }) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M7 3.5L1.5 6.5L7 9.5L12.5 6.5L7 3.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M4 8V10.5C4 10.5 5 12 7 12C9 12 10 10.5 10 10.5V8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12.5"
        y1="6.5"
        x2="12.5"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  Activity: ({ className }) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <polyline
        points="1,7 3.5,7 5,3.5 7,10.5 9,5.5 10.5,7 13,7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

// ── Main component ───────────────────────────────────────────────────────────

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

  const off = !settings.enrich
  const activeTemplate = matchTemplate(settings)

  const docsProviderUrl = docsSiteUrl('ai-agent')

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
              const TemplateIcon = TEMPLATE_SVG[t.icon]
              const active = activeTemplate === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update(t.settings)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-lg border p-2.5 text-left transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/5 dark:border-primary/30 dark:bg-primary/[0.08]'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <TemplateIcon
                    className={cn(
                      active
                        ? 'text-primary dark:text-primary/90'
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
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
              <EnhanceGlyph className="text-foreground/70" />
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
          <div className="space-y-1.5 rounded-md border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2.5">
            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                No LLM provider configured — deterministic copy will be shown.
                Set a provider key (e.g.{' '}
                <code className="rounded bg-amber-500/15 px-0.5 font-mono text-[10px]">
                  OPENROUTER_API_KEY
                </code>{' '}
                or{' '}
                <code className="rounded bg-amber-500/15 px-0.5 font-mono text-[10px]">
                  ANYROUTER_API_KEY
                </code>
                ).
              </span>
            </div>
            <a
              href={docsProviderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-5.5 inline-flex items-center gap-1 text-[11px] text-amber-700/80 hover:text-amber-700 dark:text-amber-400/80 dark:hover:text-amber-400 underline underline-offset-2"
            >
              Configure a provider
              <ExternalLink className="size-3" />
            </a>
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
                      ? 'border-primary/40 bg-primary/5 dark:border-primary/30 dark:bg-primary/[0.08]'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4',
                      active
                        ? 'text-primary dark:text-primary/90'
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
            <Label className="flex items-center justify-between gap-1.5 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Cpu className="size-3.5 text-muted-foreground" />
                Model
              </span>
              <a
                href={docsProviderUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={off ? -1 : undefined}
                className="flex items-center gap-0.5 text-[10px] font-normal text-muted-foreground hover:text-foreground transition-colors"
              >
                Providers
                <ExternalLink className="size-2.5" />
              </a>
            </Label>
            <ModelCombobox
              value={settings.model}
              models={models}
              defaultModelLabel={status?.defaultModel}
              disabled={off}
              onValueChange={(value) => update({ model: value })}
            />
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
