/**
 * Prompt templates for LLM calls in the agent system.
 *
 * This module loads structured prompt templates from .md files and provides
 * helper functions for building LLM requests.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Prompt Organization
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Prompts are stored as .md files in the prompts/ directory for easy editing:
 * - intent-classifier.md: Intent classification prompt
 * - sql-generator.md: SQL generation prompt
 * - response-generator.md: Response formatting prompt
 *
 * This allows non-developers to modify prompts without touching TypeScript code.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Load a prompt from a .md file
 */
function loadPrompt(filename: string): string {
  const filePath = join(__dirname, 'prompts', filename)
  try {
    return readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error(`Failed to load prompt from ${filePath}:`, error)
    return ''
  }
}

/**
 * System prompt for intent classification
 */
export const INTENT_CLASSIFIER_SYSTEM = loadPrompt('intent-classifier.md')

/**
 * System prompt for SQL generation
 */
export const SQL_GENERATOR_SYSTEM = loadPrompt('sql-generator.md')

/**
 * System prompt for response generation
 */
export const RESPONSE_GENERATOR_SYSTEM = loadPrompt('response-generator.md')

/**
 * User message template for intent classification
 */
export interface IntentInput {
  readonly message: string
  readonly history?: readonly string[]
}

export function buildIntentPrompt(input: IntentInput): string {
  let prompt = `User message: "${input.message}"`

  if (input.history && input.history.length > 0) {
    prompt += `\n\nRecent conversation history:\n${input.history.slice(-3).join('\n')}`
  }

  prompt += '\n\nClassify the intent and respond with JSON only.'

  return prompt
}

/**
 * User message template for SQL generation
 */
export interface SqlGenerationInput {
  readonly message: string
  readonly intent: {
    readonly type: string
    readonly entities: readonly string[]
  }
  readonly hostInfo?: {
    readonly version?: string
    readonly tables?: readonly string[]
  }
}

export function buildSqlGenerationPrompt(input: SqlGenerationInput): string {
  let prompt = `User request: "${input.message}"`

  prompt += `\n\nDetected intent: ${input.intent.type}`

  if (input.intent.entities.length > 0) {
    prompt += `\nDetected entities: ${input.intent.entities.join(', ')}`
  }

  if (input.hostInfo?.version) {
    prompt += `\nClickHouse version: ${input.hostInfo.version}`
  }

  if (input.hostInfo?.tables && input.hostInfo.tables.length > 0) {
    prompt += `\nAvailable tables: ${input.hostInfo.tables.slice(0, 20).join(', ')}`
  }

  prompt += '\n\nGenerate the SQL query and respond with JSON only.'

  return prompt
}

/**
 * User message template for response generation
 */
export interface ResponseInput {
  readonly originalMessage: string
  readonly query?: {
    readonly sql: string
    readonly explanation: string
  }
  readonly result?: {
    readonly rows: readonly unknown[]
    readonly rowCount: number
    readonly duration: number
  }
  readonly error?: string
}

export function buildResponsePrompt(input: ResponseInput): string {
  let prompt = `Original user question: "${input.originalMessage}"\n\n`

  if (input.query) {
    prompt += `Query executed:\n\`\`\`sql\n${input.query.sql}\n\`\`\`\n`
    prompt += `Explanation: ${input.query.explanation}\n\n`
  }

  if (input.result) {
    prompt += `Results: ${input.result.rowCount} rows returned in ${input.result.duration}ms\n`
    if (input.result.rowCount > 0 && input.result.rowCount <= 5) {
      prompt += `Sample data:\n\`\`\`json\n${JSON.stringify(input.result.rows.slice(0, 3), null, 2)}\n\`\`\`\n`
    }
  }

  if (input.error) {
    prompt += `Error encountered: ${input.error}\n`
  }

  prompt += '\nGenerate a helpful response and respond with JSON only.'

  return prompt
}
