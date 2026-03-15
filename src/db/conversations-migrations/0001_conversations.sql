-- Migration 0001: Conversations table for AI agent chat history
--
-- Schema design:
--   Fixed columns  = GROUP BY, WHERE, ORDER BY, SUM targets (dashboards)
--   metadata JSON  = extensible drill-down data (no ALTER TABLE ever needed)
--
-- Supported analytics:
--   - Token usage over time (by model, provider, host)
--   - Cost tracking and budgeting (with cache cost breakdown in metadata)
--   - Performance monitoring (latency, TTFT in metadata)
--   - Model comparison and routing analysis
--   - Quality monitoring (ratings, errors, finish reasons)
--   - Tool usage patterns (via metadata)
--   - Agent stage tracking (via metadata)

CREATE TABLE IF NOT EXISTS conversations (
  -- === Identity ===
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',

  -- === Content ===
  messages TEXT NOT NULL DEFAULT '[]',
  message_count INTEGER NOT NULL DEFAULT 0,

  -- === LLM Configuration (filterable) ===
  model TEXT,                                     -- "stepfun/step-3.5-flash:free"
  provider TEXT,                                  -- "openrouter", "openai", "anthropic"
  host_id INTEGER,                                -- which ClickHouse host was targeted

  -- === Token Usage (aggregatable) ===
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  total_reasoning_tokens INTEGER NOT NULL DEFAULT 0,  -- chain-of-thought (o1/o3/Claude thinking)
  total_cached_tokens INTEGER NOT NULL DEFAULT 0,     -- prompt cache hits (reduced cost)

  -- === Performance (aggregatable) ===
  total_duration_ms INTEGER NOT NULL DEFAULT 0,       -- wall-clock time
  total_cost_usd REAL NOT NULL DEFAULT 0,             -- provider-reported total cost

  -- === Quality (filterable) ===
  finish_reason TEXT,                             -- "stop", "length", "tool-calls", "error"
  user_rating INTEGER,                            -- -1 (thumbs down), 0 (none), 1 (thumbs up)
  error_count INTEGER NOT NULL DEFAULT 0,

  -- === Extensible Metadata (JSON, never needs ALTER TABLE) ===
  -- See ConversationMetadata TypeScript interface for documented keys:
  --   streaming, firstTokenMs, tokensPerSecond, chunkCount
  --   temperature, maxTokens, topP, systemPromptHash
  --   currentStage, stepCount, stageTransitions[]
  --   toolCallCount, toolNames[], toolDurations, toolErrors
  --   summary, suggestions[], tags[]
  --   retryCount, regenerationCount
  --   cacheCreationInputTokens, cacheReadInputTokens
  --   inputCostUsd, outputCostUsd, cacheReadCostUsd, cacheCreationCostUsd
  --   openrouter: { generationId, actualModel, pricingTier, nativeTokens }
  metadata TEXT NOT NULL DEFAULT '{}',

  -- === Timestamps (ms since Unix epoch) ===
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Primary access pattern: list user's conversations by recency
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON conversations(user_id, updated_at DESC);

-- Skip empty conversations in listings
CREATE INDEX IF NOT EXISTS idx_conversations_active
  ON conversations(user_id, updated_at DESC)
  WHERE message_count > 0;

-- Usage dashboards: group/filter by model and provider
CREATE INDEX IF NOT EXISTS idx_conversations_model
  ON conversations(model, provider)
  WHERE model IS NOT NULL;

-- Cost tracking dashboard
CREATE INDEX IF NOT EXISTS idx_conversations_cost
  ON conversations(user_id, total_cost_usd)
  WHERE total_cost_usd > 0;

-- Error monitoring
CREATE INDEX IF NOT EXISTS idx_conversations_errors
  ON conversations(user_id, error_count)
  WHERE error_count > 0;
