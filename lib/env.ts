/**
 * Environment variable validation and configuration
 * Supports both server and client-side usage
 */

import { z } from 'zod'

// Server-side environment variables
const serverSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().default('file:./data/app.db'),
  DB_DIALECT: z.enum(['sqlite', 'postgres']).default('sqlite'),

  // ClickHouse Configuration (existing)
  CLICKHOUSE_HOST: z.string().optional(),
  CLICKHOUSE_USER: z.string().optional(),
  CLICKHOUSE_PASSWORD: z.string().optional(),
  CLICKHOUSE_NAME: z.string().optional(),
  CLICKHOUSE_MAX_EXECUTION_TIME: z.string().default('60'),

  // Better Auth Configuration
  BETTER_AUTH_URL: z.string().default('http://localhost:3000'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters').optional(),

  // OAuth Providers (optional)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),

  // Analytics
  NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: z.string().optional(),
  NEXT_PUBLIC_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_SELINE_ENABLED: z.string().optional(),
})

// Client-side environment variables
const clientSchema = z.object({
  NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: z.string().optional(),
  NEXT_PUBLIC_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_SELINE_ENABLED: z.string().optional(),
})

// Parse and validate
const getServerEnv = () => {
  const result = serverSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid server environment variables:', result.error.flatten().fieldErrors)
    throw new Error('Server environment validation failed')
  }

  return result.data
}

const getClientEnv = () => {
  const result = clientSchema.safeParse(process.env)

  if (!result.success) {
    console.warn('⚠️ Invalid client environment variables:', result.error.flatten().fieldErrors)
    return {}
  }

  return result.data
}

// Export typed environment
export const env = typeof window === 'undefined' ? getServerEnv() : getClientEnv()

// Helper functions
export const isAuthEnabled = (): boolean => {
  return Boolean(env.BETTER_AUTH_SECRET)
}

export const isOAuthConfigured = (): boolean => {
  return Boolean(
    (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) ||
    (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
  )
}

export const isEncryptionConfigured = (): boolean => {
  return Boolean(env.ENCRYPTION_KEY)
}
