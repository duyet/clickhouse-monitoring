'use client'

import { CheckIcon, ZapIcon } from 'lucide-react'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAgentModel } from '@/lib/hooks/use-agent-model'

export interface AgentSettingsProps {
  /** Callback when model changes */
  onModelChange?: (model: string) => void
}

/**
 * Model capability badge component
 */
function CapabilityBadge({
  enabled,
  label,
}: {
  readonly enabled: boolean
  readonly label: string
}) {
  return (
    <Badge
      variant={enabled ? 'default' : 'outline'}
      className="text-[10px]"
      title={enabled ? `Supported: ${label}` : `Not supported: ${label}`}
    >
      {enabled ? <CheckIcon className="h-2.5 w-2.5 mr-0.5" /> : null}
      {label}
    </Badge>
  )
}

/**
 * Agent Settings Component
 *
 * Provides model selection UI with capability badges.
 * Persists selection to localStorage and displays current model info.
 *
 * Features:
 * - Model selection dropdown with free tier models
 * - Capability badges (Streaming, Tools, Context, Fast)
 * - Human-readable model names
 * - Auto-saves to localStorage
 *
 * @example
 * ```tsx
 * <AgentSettings onModelChange={(model) => console.log(model)} />
 * ```
 */
export function AgentSettings({ onModelChange }: AgentSettingsProps) {
  const { model, models, capabilities, setModel } = useAgentModel()

  // Format context length for display
  const contextDisplay = useMemo(() => {
    const cl = capabilities.contextLength
    if (cl >= 1_000_000) return `${(cl / 1_000_000).toFixed(0)}M`
    if (cl >= 1000) return `${(cl / 1000).toFixed(0)}K`
    return String(cl)
  }, [capabilities.contextLength])

  // Handle model change
  const handleModelChange = (newModel: string): void => {
    setModel(newModel)
    onModelChange?.(newModel)
  }

  const currentModelData = models.find((m) => m.id === model)

  return (
    <div className="space-y-3">
      {/* Model selection */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Model:</label>
        <Select value={model} onValueChange={handleModelChange}>
          <SelectTrigger className="h-8 text-xs max-w-[200px]">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <span>{m.name}</span>
                  {m.fast && (
                    <span title="Fast model">
                      <ZapIcon className="h-3 w-3 text-yellow-500" />
                    </span>
                  )}
                  {m.fallback && (
                    <Badge variant="outline" className="text-[9px]">
                      Default
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Capability badges */}
      <div className="flex flex-wrap gap-1.5">
        <CapabilityBadge enabled={capabilities.streaming} label="Streaming" />
        <CapabilityBadge enabled={capabilities.tools} label="Tools" />
        <Badge
          variant="outline"
          className="text-[10px]"
          title={`Context window: ${capabilities.contextLength} tokens`}
        >
          {contextDisplay} Context
        </Badge>
        {currentModelData?.fast && (
          <Badge
            variant="outline"
            className="text-[10px] text-yellow-600 dark:text-yellow-400"
            title="Optimized for low latency"
          >
            <ZapIcon className="h-2.5 w-2.5 mr-0.5" />
            Fast
          </Badge>
        )}
      </div>
    </div>
  )
}
