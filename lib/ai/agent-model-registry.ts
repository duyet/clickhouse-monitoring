/**
 * Agent Model Registry
 *
 * Defines available models and which providers serve them.
 * Shared between client and server code.
 *
 * The dropdown generates all valid `{provider}:{model}` combinations
 * from this registry + the provider list.
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

/**
 * All available models. Each entry lists which providers offer it.
 * The dropdown generates `provider:model` combinations from this.
 */
export const MODEL_REGISTRY: readonly ModelEntry[] = [
  // ── OpenRouter-specific routers ──
  {
    id: 'openrouter/free',
    description: 'Auto-router: picks a free tool-capable model',
    contextLength: 200_000,
    providers: ['openrouter'],
  },
  {
    id: 'openrouter/auto',
    description: 'Auto-router: picks the best model (paid)',
    contextLength: 2_000_000,
    providers: ['openrouter'],
  },

  // ── Free-tier models ──
  {
    id: 'z-ai/glm-4.5-air:free',
    description: 'GLM 4.5 Air, free tier',
    contextLength: 131_072,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'arcee-ai/trinity-large-preview:free',
    description: 'Arcee Trinity Large Preview, free tier',
    contextLength: 131_000,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'qwen/qwen3-coder:free',
    description: 'Qwen3 Coder, free tier, 1M context',
    contextLength: 1_048_576,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct:free',
    description: 'Qwen3 Next 80B Instruct, free tier',
    contextLength: 262_144,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'openai/gpt-oss-120b:free',
    description: 'OpenAI GPT-OSS 120B, free tier',
    contextLength: 131_072,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'openai/gpt-oss-20b:free',
    description: 'OpenAI GPT-OSS 20B, free tier',
    contextLength: 131_072,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    description: 'Meta Llama 3.3 70B Instruct, free tier',
    contextLength: 131_072,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'google/gemma-4-31b-it:free',
    description: 'Google Gemma 4 31B IT, free tier',
    contextLength: 262_144,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },

  // ── Paid models (multi-provider) ──
  {
    id: 'qwen/qwen3.5-397b-a17b',
    description: 'Qwen 3.5 397B-A17B MoE',
    contextLength: 131_072,
    pricing: { inputPerMillion: 0.35, outputPerMillion: 0.4 },
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'google/gemma-4-26b-a4b-it',
    description: 'Google Gemma 4 26B IT',
    contextLength: 262_144,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'z-ai/glm-4.7-flash',
    description: 'GLM 4.7 Flash',
    contextLength: 131_072,
    providers: ['openrouter', 'nvidia', 'anyrouter'],
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    description: 'NVIDIA Nemotron 70B Instruct',
    contextLength: 131_072,
    providers: ['nvidia'],
  },
  {
    id: 'minimax/minimax-m2.7',
    description: 'MiniMax production model (paid)',
    contextLength: 200_000,
    pricing: { inputPerMillion: 0.5, outputPerMillion: 1.5 },
    providers: ['openrouter'],
  },
]

/**
 * Generate all `provider:model` combinations for the dropdown.
 */
export function getAllModelOptions(): string[] {
  return MODEL_REGISTRY.flatMap((m) => m.providers.map((p) => `${p}:${m.id}`))
}

/**
 * Find the ModelEntry for a provider-agnostic model ID.
 */
export function findModelEntry(modelId: string): ModelEntry | undefined {
  return MODEL_REGISTRY.find((m) => m.id === modelId)
}

/**
 * Returns true for free-tier model IDs.
 * Matches `openrouter/free` exactly and any `:free` suffix.
 */
export function isFreeAgentModel(model: string): boolean {
  return model === 'openrouter/free' || model.endsWith(':free')
}
