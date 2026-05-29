/**
 * Zod schema for ClickHouse environment variables
 * Validates at parse-time with clear error messages
 */

import { z } from 'zod'

export const clickhouseEnvSchema = z.object({
  CLICKHOUSE_HOST: z
    .string()
    .min(1, 'CLICKHOUSE_HOST is required')
    .describe('Comma-separated list of ClickHouse host URLs'),
  CLICKHOUSE_USER: z
    .string()
    .optional()
    .default('default')
    .describe('Comma-separated list of ClickHouse users'),
  CLICKHOUSE_PASSWORD: z
    .string()
    .optional()
    .default('')
    .describe('Comma-separated list of ClickHouse passwords'),
  CLICKHOUSE_NAME: z
    .string()
    .optional()
    .describe('Comma-separated list of custom host names'),
  CLICKHOUSE_MAX_EXECUTION_TIME: z.coerce
    .number()
    .positive()
    .optional()
    .default(60)
    .describe('Query timeout in seconds'),
})

export type ClickHouseEnv = z.infer<typeof clickhouseEnvSchema>

/** Graceful degradation fallback when CLICKHOUSE_HOST is missing */
const ENV_FALLBACK: ClickHouseEnv = {
  CLICKHOUSE_HOST: '',
  CLICKHOUSE_USER: 'default',
  CLICKHOUSE_PASSWORD: '',
  CLICKHOUSE_NAME: undefined,
  CLICKHOUSE_MAX_EXECUTION_TIME: 60,
}

/**
 * Use globalThis for the env cache so that all module instances (whether
 * loaded directly, via `?test=` query-param, or through mock.module) share
 * the same cache. Without this, Bun's mock.module / cache-busting imports
 * create separate module instances with separate module-level state, which
 * breaks `_resetEnvCache()` in tests.
 */
const GLOBAL_CACHE_KEY = '__chm_clickhouse_env_cache__' as const

function getCachedEnv(): ClickHouseEnv | null {
  return (globalThis as Record<string, unknown>)[
    GLOBAL_CACHE_KEY
  ] as ClickHouseEnv | null
}

function setCachedEnv(env: ClickHouseEnv | null): void {
  ;(globalThis as Record<string, unknown>)[GLOBAL_CACHE_KEY] = env
}

/**
 * Validate ClickHouse environment variables.
 * Result is cached after first call since env vars don't change at runtime.
 * Returns parsed and validated config, or logs errors and returns defaults for graceful degradation.
 */
export function validateClickHouseEnv(): ClickHouseEnv {
  const cached = getCachedEnv()
  if (cached) return cached

  const result = clickhouseEnvSchema.safeParse({
    CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST,
    CLICKHOUSE_USER: process.env.CLICKHOUSE_USER,
    CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD,
    CLICKHOUSE_NAME: process.env.CLICKHOUSE_NAME,
    CLICKHOUSE_MAX_EXECUTION_TIME: process.env.CLICKHOUSE_MAX_EXECUTION_TIME,
  })

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    console.error(
      `[ClickHouse] Environment validation failed:\n${formatted}\n\n` +
        'Please check your .env.local or deployment environment settings.\n' +
        'Required: CLICKHOUSE_HOST (e.g., http://localhost:8123)'
    )

    return ENV_FALLBACK
  }

  setCachedEnv(result.data)
  return result.data
}

/**
 * Reset the cached env — for use in tests only.
 */
export function _resetEnvCache(): void {
  setCachedEnv(null)
}
