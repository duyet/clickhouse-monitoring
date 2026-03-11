/**
 * Agent state interfaces for LangGraph-based AI features.
 *
 * This module defines the TypeScript interfaces that represent the state
 * that flows through the LangGraph agent nodes. The state is passed between
 * nodes and updated as the agent processes user queries.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * State Flow Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * User Message → [Intent Node] → [SQL Generation Node] → [Query Execution Node]
 *                     ↓                    ↓                         ↓
 *               Update State        Update State              Update State
 *
 * Each node receives the current state, performs its function, and returns
 * a partial state update that gets merged into the overall state.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Represents a single message in the conversation history
 */
export interface AgentMessage {
  /** Unique identifier for the message */
  readonly id: string
  /** Message role: user, assistant, or system */
  readonly role: 'user' | 'assistant' | 'system'
  /** Message content */
  readonly content: string
  /** Timestamp when message was created */
  readonly timestamp: number
  /** Optional metadata for the message */
  readonly metadata?: {
    readonly node?: string
    readonly iterations?: number
    readonly duration?: number
    readonly model?: string
    readonly tokens?: number
    readonly [key: string]: unknown
  }
}

/**
 * Represents the intent detected from a user query
 */
export interface QueryIntent {
  /** The classified intent type */
  readonly type:
    | 'query' // Execute a SQL query
    | 'analysis' // Analyze data patterns
    | 'explanation' // Explain database concepts
    | 'exploration' // Browse schema/data
    | 'unknown' // Unable to determine intent
  /** Confidence score for the intent classification (0-1) */
  readonly confidence: number
  /** Detected entities in the query (table names, columns, metrics) */
  readonly entities: readonly string[]
  /** Suggested query parameters based on intent */
  readonly suggestions?: {
    readonly timeRange?: string
    readonly tables?: readonly string[]
    readonly aggregation?: string
  }
}

/**
 * Represents a generated SQL query with metadata
 */
export interface GeneratedQuery {
  /** The SQL query string */
  readonly sql: string
  /** Natural language explanation of what the query does */
  readonly explanation: string
  /** Detected or assumed tables being queried */
  readonly tables: readonly string[]
  /** Whether the query is read-only (SELECT) or modifies data */
  readonly isReadOnly: boolean
  /** Query complexity estimate */
  readonly complexity: 'simple' | 'medium' | 'complex'
  /** Optional warning about the query */
  readonly warning?: string
}

/**
 * Represents the result of executing a query
 */
export interface QueryResult {
  /** Whether the query executed successfully */
  readonly success: boolean
  /** Result rows (if successful) */
  readonly rows?: readonly unknown[]
  /** Number of rows returned */
  readonly rowCount?: number
  /** Execution duration in milliseconds */
  readonly duration: number
  /** Error message (if failed) */
  readonly error?: string
  /** Query execution metadata */
  readonly metadata?: {
    readonly queryId: string
    readonly host: string
    readonly clickhouseVersion?: string
  }
}

/**
 * Represents the final response from the agent
 */
export interface AgentResponse {
  /** The response content to show the user */
  readonly content: string
  /** Type of response */
  readonly type: 'text' | 'query_result' | 'error' | 'explanation'
  /** Optional data included with the response */
  readonly data?: {
    readonly query?: GeneratedQuery
    readonly result?: QueryResult
    readonly visualization?: {
      readonly type: 'table' | 'chart' | 'metric'
      readonly config: unknown
    }
    readonly [key: string]: unknown // Allow arbitrary data for flexibility
  }
  /** Suggested follow-up questions */
  readonly suggestions?: readonly string[]
}

/**
 * Main agent state that flows through the LangGraph nodes
 *
 * This state is accumulated as the agent processes the user's request.
 * Each node receives the current state and returns partial updates
 * that get merged into this state.
 */
export interface AgentState {
  /** The user's original input message */
  readonly userInput: string
  /** Host identifier for multi-instance support */
  readonly hostId: number
  /** Optional LLM model to use for this request (from client selection) */
  readonly model?: string
  /** Conversation history for context */
  readonly messages: readonly AgentMessage[]
  /** Detected intent from the user's query */
  readonly intent?: QueryIntent
  /** Generated SQL query (if applicable) */
  readonly generatedQuery?: GeneratedQuery
  /** Query execution result (if executed) */
  readonly queryResult?: QueryResult
  /** Final agent response */
  readonly response?: AgentResponse
  /** Any errors that occurred during processing */
  readonly error?: {
    readonly message: string
    readonly node: string
    readonly recoverable: boolean
  }
  /** Number of steps taken in the agent workflow */
  readonly stepCount: number
  /** Timestamp when the agent request started */
  readonly startedAt: number
  /** Optional user preferences for the response */
  readonly preferences?: {
    readonly verbose?: boolean
    readonly includeSql?: boolean
    readonly maxResults?: number
  }
  /** Query analysis results from query analyzer node */
  readonly queryInsights?: import('./nodes/query-analyzer').QueryInsights
  /** Optimization recommendations from query optimizer node */
  readonly optimizationSuggestions?: import('./nodes/query-optimizer').OptimizationRecommendations
}

/**
 * Input type for creating a new agent state
 */
export interface CreateAgentStateInput {
  /** The user's message */
  readonly message: string
  /** Host identifier (default: 0) */
  readonly hostId?: number
  /** Optional LLM model to use (overrides default) */
  readonly model?: string
  /** Optional existing conversation history */
  readonly history?: readonly AgentMessage[]
  /** Optional user preferences */
  readonly preferences?: {
    readonly verbose?: boolean
    readonly includeSql?: boolean
    readonly maxResults?: number
  }
}

/**
 * Creates an initial agent state from user input
 */
export function createInitialState(input: CreateAgentStateInput): AgentState {
  return {
    userInput: input.message,
    hostId: input.hostId ?? 0,
    model: input.model,
    messages: input.history ?? [
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: input.message,
        timestamp: Date.now(),
      },
    ],
    stepCount: 0,
    startedAt: Date.now(),
    preferences: input.preferences,
  }
}

/**
 * Type guard to check if the agent state has a completed response
 */
export function hasResponse(state: AgentState): state is AgentState & {
  readonly response: AgentResponse
} {
  return state.response !== undefined
}

/**
 * Type guard to check if the agent state has an error
 */
export function hasError(state: AgentState): state is AgentState & {
  readonly error: {
    readonly message: string
    readonly node: string
    readonly recoverable: boolean
  }
} {
  return state.error !== undefined
}

/**
 * Type guard to check if intent has been classified
 */
export function hasIntent(state: AgentState): state is AgentState & {
  readonly intent: QueryIntent
} {
  return state.intent !== undefined
}
