'use client'

import { Badge } from '@/components/ui/badge'
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
 * - Capability badges (Tools, Streaming, Vision)
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
    if (models.some((m) => m.id === newModel)) {
      setModel(newModel as OpenAIModel)
      onModelChange?.(newModel)
    }
  }

  const currentModelData = models.find((m) => m.id === model)

  return (
    <div className="space-y-3">
      {/* Model selection */}
      <Select value={model} onValueChange={handleModelChange}>
        <SelectTrigger className="h-8 text-xs max-w-[200px]">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.id} value={m.id} className="text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{m.name}</span>
                {m.supportsTools && (
                  <Badge variant="outline" className="text-[10px] px-1">
                    Tools
                  </Badge>
                )}
                {m.supportsStreaming && (
                  <Badge variant="outline" className="text-[10px] px-1">
                    Stream
                  </Badge>
                )}
                {m.supportsVision && (
                  <Badge variant="outline" className="text-[10px] px-1">
                    Vision
                  </Badge>
                )}
                {m.isFree && (
                  <Badge variant="secondary" className="text-[10px] px-1">
                    Free
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Model info with capabilities */}
      {currentModelData && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">
            {currentModelData.description}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {currentModelData.supportsTools && (
              <Badge variant="default" className="text-[10px]">
                ✓ Tools
              </Badge>
            )}
            {currentModelData.supportsStreaming && (
              <Badge variant="default" className="text-[10px]">
                ✓ Streaming
              </Badge>
            )}
            {currentModelData.supportsVision && (
              <Badge variant="default" className="text-[10px]">
                ✓ Vision
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
