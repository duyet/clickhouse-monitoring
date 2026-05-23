/**
 * Agent Model Registry
 *
 * Curated list of models grouped by provider availability.
 * The dropdown generates `provider:model` combinations from this.
 */

export interface ModelEntry {
  /** Provider-agnostic model ID (e.g., 'qwen/qwen3.5-397b-a17b') */
  id: string
  /** Human-readable description */
  description: string
  /** Context window in tokens */
  contextLength: number
  /** Per-million-token pricing (omit for free/own-key models) */
  pricing?: { inputPerMillion: number; outputPerMillion: number }
  /** Which provider IDs can serve this model */
  providers: string[]
}

export const DEFAULT_AGENT_MODEL = 'anyrouter:@preset/chmonitor'

export const MODEL_REGISTRY: readonly ModelEntry[] = [
  // ── Presets (auto-routing via AnyRouter) ──
  {
    id: '@preset/chmonitor',
    description: 'Preset: ClickHouse Monitor agent routing',
    contextLength: 200_000,
    providers: ['anyrouter'],
  },

  // ── OpenRouter auto-routers ──
  {
    id: 'openrouter/free',
    description: 'Auto-router: free tool-capable model',
    contextLength: 200_000,
    providers: ['openrouter'],
  },
  {
    id: 'openrouter/auto',
    description: 'Auto-router: best available (paid)',
    contextLength: 2_000_000,
    providers: ['openrouter'],
  },

  // ── Free-tier (OpenRouter only) ──
  {
    id: 'qwen/qwen3-coder:free',
    description: 'Qwen3 Coder, 1M context',
    contextLength: 1_048_576,
    providers: ['openrouter'],
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    description: 'GLM 4.5 Air',
    contextLength: 131_072,
    providers: ['openrouter'],
  },
  {
    id: 'google/gemma-4-31b-it:free',
    description: 'Gemma 4 31B IT',
    contextLength: 262_144,
    providers: ['openrouter'],
  },

  // ── Paid: multi-provider ──
  {
    id: 'qwen/qwen3.5-397b-a17b',
    description: 'Qwen 3.5 397B MoE',
    contextLength: 131_072,
    pricing: { inputPerMillion: 0.35, outputPerMillion: 0.4 },
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'z-ai/glm-4.7-flash',
    description: 'GLM 4.7 Flash',
    contextLength: 131_072,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'google/gemini-3.1-flash-lite',
    description: 'Gemini 3.1 Flash Lite',
    contextLength: 1_000_000,
    pricing: { inputPerMillion: 0.25, outputPerMillion: 1.5 },
    providers: ['anyrouter'],
  },
  {
    id: 'google/gemma-4-26b-a4b-it',
    description: 'Gemma 4 26B IT',
    contextLength: 262_144,
    providers: ['openrouter', 'anyrouter'],
  },

  // ── NVIDIA-only ──
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    description: 'Nemotron 70B Instruct',
    contextLength: 131_072,
    providers: ['nvidia'],
  },
]

export function getAllModelOptions(): string[] {
  return MODEL_REGISTRY.flatMap((m) => m.providers.map((p) => `${p}:${m.id}`))
}

export function isFreeAgentModel(model: string): boolean {
  return model === 'openrouter/free' || model.endsWith(':free')
}
