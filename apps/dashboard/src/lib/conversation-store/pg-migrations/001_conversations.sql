-- Migration 001: Conversations table for AI agent chat history
--
-- PostgreSQL version — same structure as D1 but uses JSONB for
-- messages and metadata (enables JSON path queries and indexing).

CREATE TABLE IF NOT EXISTS conversations (
  -- === Identity ===
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',

  -- === Content ===
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INTEGER NOT NULL DEFAULT 0,

  -- === LLM Configuration (filterable) ===
  model TEXT,
  provider TEXT,
  host_id INTEGER,

  -- === Token Usage (aggregatable) ===
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  total_reasoning_tokens INTEGER NOT NULL DEFAULT 0,
  total_cached_tokens INTEGER NOT NULL DEFAULT 0,

  -- === Performance (aggregatable) ===
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0,

  -- === Quality (filterable) ===
  finish_reason TEXT,
  user_rating INTEGER,
  error_count INTEGER NOT NULL DEFAULT 0,

  -- === Extensible Metadata (JSONB, never needs ALTER TABLE) ===
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- === Timestamps (ms since Unix epoch) ===
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_active
  ON conversations(user_id, updated_at DESC)
  WHERE message_count > 0;

CREATE INDEX IF NOT EXISTS idx_conversations_model
  ON conversations(model, provider)
  WHERE model IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_cost
  ON conversations(user_id, total_cost_usd)
  WHERE total_cost_usd > 0;

CREATE INDEX IF NOT EXISTS idx_conversations_errors
  ON conversations(user_id, error_count)
  WHERE error_count > 0;
