'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type OpenAIModel, useAgentModel } from '@/lib/hooks/use-agent-model'

export interface AgentSettingsProps {
  /** Callback when model changes */
  onModelChange?: (model: string) => void
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
  const { model, models, setModel } = useAgentModel()

  // Handle model change
  const handleModelChange = (newModel: string): void => {
    // Validate that the model exists before setting
    if (newModel in models.map((m) => m.id)) {
      setModel(newModel as OpenAIModel)
      onModelChange?.(newModel)
    }
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
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model info */}
      {currentModelData && (
        <div className="text-xs text-muted-foreground">
          {currentModelData.description}
        </div>
      )}
    </div>
  )
}
