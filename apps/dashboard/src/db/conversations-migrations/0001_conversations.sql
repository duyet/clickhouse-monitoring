-- Conversation history for assistant-ui agent chat.
-- Keep this schema aligned with lib/conversation-store/postgres-store.ts.

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  messages TEXT NOT NULL DEFAULT '[]',
  message_count INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  provider TEXT,
  host_id INTEGER,
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  total_reasoning_tokens INTEGER NOT NULL DEFAULT 0,
  total_cached_tokens INTEGER NOT NULL DEFAULT 0,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0,
  finish_reason TEXT,
  user_rating INTEGER,
  error_count INTEGER NOT NULL DEFAULT 0,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
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
