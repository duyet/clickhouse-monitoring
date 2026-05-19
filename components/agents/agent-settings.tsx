'use client'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { type OpenAIModel, useAgentModel } from '@/lib/hooks/use-agent-model'

const MODEL_PROVIDER_BADGE_CLASS =
  'shrink-0 border-border/60 bg-muted/60 px-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground'
const MODEL_CAPABILITY_BADGE_CLASS =
  'px-1 text-[10px] text-muted-foreground hover:text-foreground'

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
    <div className="flex flex-col gap-3">
      {/* Model selection */}
      <Select value={model} onValueChange={handleModelChange}>
        <SelectTrigger className="h-8 w-full text-xs sm:w-auto sm:max-w-[280px]">
          {currentModelData ? (
            <div className="flex items-center gap-1.5 truncate">
              <Badge variant="outline" className={MODEL_PROVIDER_BADGE_CLASS}>
                {currentModelData.provider}
              </Badge>
              <span className="truncate">{currentModelData.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select model</span>
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={MODEL_PROVIDER_BADGE_CLASS}
                  >
                    {m.provider}
                  </Badge>
                  <span>{m.name}</span>
                  {m.supportsTools && (
                    <Badge
                      variant="outline"
                      className={MODEL_CAPABILITY_BADGE_CLASS}
                    >
                      Tools
                    </Badge>
                  )}
                  {m.supportsStreaming && (
                    <Badge
                      variant="outline"
                      className={MODEL_CAPABILITY_BADGE_CLASS}
                    >
                      Stream
                    </Badge>
                  )}
                  {m.supportsVision && (
                    <Badge
                      variant="outline"
                      className={MODEL_CAPABILITY_BADGE_CLASS}
                    >
                      Vision
                    </Badge>
                  )}
                  {m.isFree && (
                    <Badge variant="secondary" className="px-1 text-[10px]">
                      Free
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Model info with capabilities */}
      {currentModelData && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">
            {currentModelData.description}
          </div>
          <div className="flex flex-wrap items-center gap-1">
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
