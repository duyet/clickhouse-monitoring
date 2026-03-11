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
  DEFAULT_MODEL,
  getModelName,
  MODELS,
  OPENROUTER_BASE_URL,
  OPENROUTER_CONFIG,
  OPENROUTER_DEFAULT_MODEL,
  OPENROUTER_MODELS,
  validateConfig,
} from './openrouter'
