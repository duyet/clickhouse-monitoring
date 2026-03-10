/**
 * Text-to-SQL Node for ClickHouse AI Agent
 *
 * This LangGraph node converts natural language queries into ClickHouse SQL
 * using schema-aware prompting and LLM integration.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Node Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Input: AgentState with userInput, intent, and hostId
 * Process:
 *   1. Build schema context from relevant tables
 *   2. Construct LLM prompt with system instructions
 *   3. Call LLM to generate SQL
 *   4. Validate generated SQL for security
 *   5. Return GeneratedQuery with metadata
 *
 * Output: Partial AgentState with generatedQuery field
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { TableSchema } from '../schemas/clickhouse-schema'
import type { AgentState, GeneratedQuery } from '../state'

import { SQL_GENERATOR_SYSTEM } from '../prompts'
import { formatSchemaForLLM } from '../schemas/clickhouse-schema'
import { validateSqlQuery } from '@/lib/api/shared/validators/sql'

/**
 * Configuration for text-to-SQL node
 */
export interface TextToSqlConfig {
  /** Maximum number of tables to include in schema context */
  readonly maxTables?: number
  /** Whether to include query templates in context */
  readonly includeTemplates?: boolean
  /** Custom system prompt override */
  readonly systemPrompt?: string
  /** LLM model to use for generation */
  readonly model?: string
  /** Debug mode for logging */
  readonly debug?: boolean
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<TextToSqlConfig> = {
  maxTables: 10,
  includeTemplates: true,
  systemPrompt: SQL_GENERATOR_SYSTEM,
  model: 'gpt-4o-mini',
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Select relevant tables based on user intent and entities
 */
function selectRelevantTables(
  userInput: string,
  intent: { readonly type: string; readonly entities: readonly string[] }
): string[] {
  const keywords = userInput.toLowerCase()

  // Keyword-based table selection
  const tableKeywords: Record<string, readonly string[]> = {
    query: ['system.query_log', 'system.processes'],
    queries: ['system.query_log', 'system.processes'],
    slow: ['system.query_log'],
    fast: ['system.query_log'],
    merge: ['system.merges', 'system.part_log'],
    mutation: ['system.merges'],
    table: ['system.tables', 'system.parts'],
    tables: ['system.tables', 'system.parts'],
    database: ['system.databases', 'system.tables'],
    databases: ['system.databases', 'system.tables'],
    size: ['system.parts', 'system.tables'],
    storage: ['system.parts', 'system.disks'],
    disk: ['system.disks', 'system.parts'],
    replica: ['system.replicas'],
    cluster: ['system.clusters'],
    zookeeper: ['system.zookeeper'],
    error: ['system.query_log', 'system.error_log'],
    fail: ['system.query_log'],
    exception: ['system.query_log'],
    cache: ['system.query_log'],
    metric: ['system.metrics', 'system.asynchronous_metrics'],
    memory: ['system.asynchronous_metrics', 'system.query_log'],
    cpu: ['system.asynchronous_metrics'],
    connection: ['system.metrics'],
  }

  const relevantTables = new Set<string>()

  // Add tables based on keyword matches
  for (const [keyword, tables] of Object.entries(tableKeywords)) {
    if (keywords.includes(keyword)) {
      for (const table of tables) {
        relevantTables.add(table)
      }
    }
  }

  // Always include query_log for query-related intents
  if (intent.type === 'query' || intent.type === 'analysis') {
    relevantTables.add('system.query_log')
  }

  // Add tables from detected entities
  for (const entity of intent.entities) {
    const lowerEntity = entity.toLowerCase()
    if (lowerEntity.startsWith('system.')) {
      relevantTables.add(entity)
    }
  }

  // Default set if no matches
  if (relevantTables.size === 0) {
    return ['system.query_log', 'system.tables', 'system.processes']
  }

  return Array.from(relevantTables)
}

/**
 * Build the prompt for SQL generation
 */
function buildPrompt(
  userInput: string,
  schemaContext: string,
  config: Required<TextToSqlConfig>
): string {
  let prompt = config.systemPrompt + '\n\n'

  prompt += 'AVAILABLE SCHEMA:\n\n'
  prompt += schemaContext + '\n\n'

  prompt += 'USER REQUEST:\n'
  prompt += `"${userInput}"\n\n`

  prompt +=
    'Generate the SQL query based on the user request and available schema.'
  prompt += ' Respond ONLY with a JSON object in the specified format.'

  return prompt
}

/**
 * Parse LLM response into GeneratedQuery
 */
function parseResponse(response: string): GeneratedQuery | null {
  try {
    // Try to extract JSON from the response
    let jsonStr = response.trim()

    // Remove markdown code blocks if present
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1]
    }

    const parsed = JSON.parse(jsonStr)

    // Validate required fields
    if (!parsed.sql || typeof parsed.sql !== 'string') {
      throw new Error('Missing or invalid "sql" field in response')
    }

    return {
      sql: parsed.sql,
      explanation: parsed.explanation ?? 'Generated SQL query',
      tables: parsed.tables ?? [],
      isReadOnly: parsed.isReadOnly ?? true,
      complexity: parsed.complexity ?? 'medium',
      warning: parsed.warning,
    }
  } catch (error) {
    if (DEFAULT_CONFIG.debug) {
      console.error('[textToSqlNode] Failed to parse LLM response:', error)
      console.error('[textToSqlNode] Response was:', response)
    }
    return null
  }
}

/**
 * Mock LLM call for development (replace with actual LLM integration)
 */
async function callLLM(prompt: string, model: string): Promise<string> {
  // TODO: Replace with actual LLM integration (e.g., OpenAI, Anthropic, local model)
  // For now, return a structured response based on common patterns

  // This is a placeholder that generates basic SQL for common queries
  // In production, this would call an actual LLM API

  if (DEFAULT_CONFIG.debug) {
    console.log('[textToSqlNode] LLM call would be made here')
    console.log('[textToSqlNode] Model:', model)
    console.log('[textToSqlNode] Prompt length:', prompt.length)
  }

  // Return a mock response for development
  // In production, this would be: return await openai.chat.completions.create(...)
  throw new Error(
    'LLM integration not yet implemented. Please set up an LLM provider.'
  )
}

/**
 * Text-to-SQL LangGraph node
 *
 * Converts natural language input to ClickHouse SQL using schema-aware prompting.
 *
 * @param state - Current agent state
 * @param config - Optional node configuration
 * @returns Partial state update with generatedQuery
 */
export async function textToSqlNode(
  state: AgentState,
  config: TextToSqlConfig = {}
): Promise<Partial<AgentState>> {
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config }

  if (effectiveConfig.debug) {
    console.log('[textToSqlNode] Processing:', state.userInput)
  }

  // Skip if intent is not query-related
  if (
    state.intent?.type !== 'query' &&
    state.intent?.type !== 'analysis' &&
    state.intent?.type !== 'exploration'
  ) {
    if (effectiveConfig.debug) {
      console.log('[textToSqlNode] Skipping - intent is', state.intent?.type)
    }
    return { stepCount: state.stepCount + 1 }
  }

  try {
    // Select relevant tables based on user input
    const relevantTableNames = selectRelevantTables(
      state.userInput,
      state.intent ?? { type: 'unknown', confidence: 0, entities: [] }
    )

    // Limit to max tables
    const selectedTables = relevantTableNames.slice(
      0,
      effectiveConfig.maxTables
    )

    if (effectiveConfig.debug) {
      console.log('[textToSqlNode] Selected tables:', selectedTables)
    }

    // Build schema context
    const schemaContext = formatSchemaForLLM(selectedTables)

    // Build prompt
    const prompt = buildPrompt(state.userInput, schemaContext, effectiveConfig)

    // Call LLM (placeholder - needs actual integration)
    let response: string
    try {
      response = await callLLM(prompt, effectiveConfig.model)
    } catch (llmError) {
      // For development, generate a basic SQL query
      if (effectiveConfig.debug) {
        console.warn(
          '[textToSqlNode] LLM call failed, using fallback:',
          llmError
        )
      }

      // Generate a simple fallback query based on intent
      if (state.userInput.toLowerCase().includes('slow')) {
        response = JSON.stringify({
          sql: "SELECT query, query_duration_ms / 1000 AS duration_sec, user, formatReadableSize(read_bytes) AS bytes, formatReadableQuantity(read_rows) AS rows FROM system.query_log WHERE type = 'QueryFinish' AND event_time >= now() - INTERVAL 24 HOUR ORDER BY query_duration_ms DESC LIMIT 10",
          explanation:
            'Retrieves the 10 slowest completed queries from the last 24 hours',
          tables: ['system.query_log'],
          isReadOnly: true,
          complexity: 'simple',
        })
      } else if (state.userInput.toLowerCase().includes('table')) {
        response = JSON.stringify({
          sql: 'SELECT database, table, sum(rows) AS total_rows, sum(bytes_on_disk) AS total_bytes, formatReadableSize(sum(bytes_on_disk)) AS readable_size FROM system.parts WHERE active GROUP BY database, table ORDER BY total_bytes DESC LIMIT 20',
          explanation: 'Lists all tables with their row counts and disk sizes',
          tables: ['system.parts'],
          isReadOnly: true,
          complexity: 'simple',
        })
      } else if (state.userInput.toLowerCase().includes('merge')) {
        response = JSON.stringify({
          sql: 'SELECT database, table, elapsed, progress, formatReadableSize(bytes_written_uncompressed) AS size, num_parts FROM system.merges ORDER BY elapsed DESC',
          explanation: 'Shows all currently running merge operations',
          tables: ['system.merges'],
          isReadOnly: true,
          complexity: 'simple',
        })
      } else {
        // Generic fallback
        response = JSON.stringify({
          sql: "SELECT * FROM system.query_log WHERE type = 'QueryFinish' AND event_time >= now() - INTERVAL 1 HOUR ORDER BY event_time DESC LIMIT 10",
          explanation: 'Retrieves recent queries from the last hour',
          tables: ['system.query_log'],
          isReadOnly: true,
          complexity: 'simple',
        })
      }
    }

    // Parse response
    const generatedQuery = parseResponse(response)

    if (!generatedQuery) {
      throw new Error('Failed to parse LLM response into SQL query')
    }

    // Validate SQL for security
    try {
      validateSqlQuery(generatedQuery.sql)
    } catch (validationError) {
      throw new Error(
        `Generated SQL failed validation: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`
      )
    }

    if (effectiveConfig.debug) {
      console.log('[textToSqlNode] Generated SQL:', generatedQuery.sql)
      console.log('[textToSqlNode] Tables:', generatedQuery.tables)
    }

    // Add system message to history
    const newMessage = {
      id: crypto.randomUUID(),
      role: 'system' as const,
      content: `Generated SQL query for: ${state.userInput}\n\`\`\`sql\n${generatedQuery.sql}\n\`\`\`\nExplanation: ${generatedQuery.explanation}`,
      timestamp: Date.now(),
      metadata: { node: 'textToSql', tables: generatedQuery.tables },
    }

    return {
      generatedQuery,
      messages: [...state.messages, newMessage],
      stepCount: state.stepCount + 1,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (effectiveConfig.debug) {
      console.error('[textToSqlNode] Error:', errorMessage)
    }

    return {
      error: {
        message: `Failed to generate SQL: ${errorMessage}`,
        node: 'textToSql',
        recoverable: true,
      },
      stepCount: state.stepCount + 1,
    }
  }
}

/**
 * Helper function to extract table names from SQL query
 * Used to populate the tables field in GeneratedQuery
 */
export function extractTablesFromSQL(sql: string): string[] {
  const tables: string[] = []

  // Match FROM and JOIN clauses
  const fromJoinRegex =
    /(?:FROM|JOIN)\s+([`"']?[\w.]+[`"']?)\s*(?:AS\s+[`"']?[\w]+[`"']?)?\s*/gi
  const matches = sql.matchAll(fromJoinRegex)

  for (const match of matches) {
    let table = match[1]
    // Remove quotes
    table = table.replace(/[`"']/g, '')
    // Only include system tables
    if (table.startsWith('system.')) {
      tables.push(table)
    }
  }

  return [...new Set(tables)] // Deduplicate
}
