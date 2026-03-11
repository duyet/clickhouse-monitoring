/**
 * LLM Module Index
 *
 * Exports LLM configuration and utilities for the agent system.
 */

// Model selection registry - use for intelligent model selection
export {
  getBestModel,
  getFastModels,
  getFreeModels,
  getSelectionModelCapabilities,
  MODEL_REGISTRY,
  type ModelSelectionCriteria,
  modelSupports,
  type SelectionModelCapabilities,
} from './model-registry'
export {
  BASE_URL,
  createLLM,
  createStreamingLLM,
  DEFAULT_MODEL,
  getModelCapabilities,
  getModelName,
  isStreamingCapable,
  isToolsCapable,
  MODELS,
  type ModelCapabilities,
  OPENROUTER_BASE_URL,
  OPENROUTER_CONFIG,
  OPENROUTER_DEFAULT_MODEL,
  OPENROUTER_MODELS,
  STREAMING_CAPABLE_MODELS,
  validateConfig,
} from './openrouter'
