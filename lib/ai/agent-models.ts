/**
 * Shared agent model metadata for both client and server code.
 */

export const AGENT_MODELS = {
  'openrouter/free': {
    name: 'openrouter/free',
    description:
      'OpenRouter auto-router: picks a working free tool-capable model (default)',
    contextLength: 200000,
  },
  'openrouter/auto': {
    name: 'openrouter/auto',
    description: 'OpenRouter auto-router: picks the best model (paid)',
    contextLength: 2000000,
  },
  'z-ai/glm-4.5-air:free': {
    name: 'z-ai/glm-4.5-air:free',
    description: 'Z.AI GLM 4.5 Air, free tier',
    contextLength: 131072,
  },
  'arcee-ai/trinity-large-preview:free': {
    name: 'arcee-ai/trinity-large-preview:free',
    description: 'Arcee Trinity Large Preview, free tier',
    contextLength: 131000,
  },
  'qwen/qwen3-coder:free': {
    name: 'qwen/qwen3-coder:free',
    description: 'Qwen3 Coder, free tier, 1M context',
    contextLength: 1048576,
  },
  'qwen/qwen3-next-80b-a3b-instruct:free': {
    name: 'qwen/qwen3-next-80b-a3b-instruct:free',
    description: 'Qwen3 Next 80B Instruct, free tier',
    contextLength: 262144,
  },
  'openai/gpt-oss-120b:free': {
    name: 'openai/gpt-oss-120b:free',
    description: 'OpenAI GPT-OSS 120B, free tier',
    contextLength: 131072,
  },
  'openai/gpt-oss-20b:free': {
    name: 'openai/gpt-oss-20b:free',
    description: 'OpenAI GPT-OSS 20B, free tier',
    contextLength: 131072,
  },
  'meta-llama/llama-3.3-70b-instruct:free': {
    name: 'meta-llama/llama-3.3-70b-instruct:free',
    description: 'Meta Llama 3.3 70B Instruct, free tier',
    contextLength: 131072,
  },
  'google/gemma-4-31b-it:free': {
    name: 'google/gemma-4-31b-it:free',
    description: 'Google Gemma 4 31B Instruct, free tier',
    contextLength: 262144,
  },
  'minimax/minimax-m2.7': {
    name: 'minimax/minimax-m2.7',
    description: 'MiniMax production model (paid)',
    contextLength: 200000,
    pricing: {
      inputPerMillion: 0.5,
      outputPerMillion: 1.5,
    },
  },
} as const

/** OpenAI-compatible model identifier. */
export type OpenAIModel = string

export interface ModelPricing {
  inputPerMillion: number
  outputPerMillion: number
}

export function isKnownModel(
  model: string
): model is keyof typeof AGENT_MODELS {
  return model in AGENT_MODELS
}
