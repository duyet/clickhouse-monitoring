/**
 * Zod Schemas for API Request Validation
 *
 * Provides type-safe validation schemas for API endpoints.
 * Centralizes validation logic to ensure consistency across routes.
 *
 * @module lib/api/schemas
 */

import { z } from 'zod'

/**
 * HostId parameter schema - validates and transforms string to number
 */
export const HostIdSchema = z
  .string()
  .transform((val) => parseInt(val, 10))
  .refine((val) => !Number.isNaN(val) && val >= 0, {
    message: 'hostId must be a non-negative integer',
  })

/**
 * Menu count key schema - validates count key format
 * Must be a non-empty string with alphanumeric characters, hyphens, and underscores
 */
export const MenuCountKeySchema = z
  .string()
  .min(1, 'count key must not be empty')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'count key must contain only alphanumeric characters, hyphens, and underscores'
  )

/**
 * Base request schema with hostId validation
 */
export const BaseRequestSchema = z.object({
  hostId: HostIdSchema,
})

/**
 * Chart request schema with optional interval, lastHours, and params
 */
export const ChartRequestSchema = BaseRequestSchema.extend({
  interval: z.string().optional(),
  lastHours: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !Number.isNaN(val) && val > 0, {
      message: 'lastHours must be a positive integer',
    })
    .optional(),
  params: z
    .string()
    .transform((val) => {
      try {
        return JSON.parse(val)
      } catch {
        throw new Error('params must be valid JSON')
      }
    })
    .optional(),
})

/**
 * Table request schema - accepts all search params
 */
export const TableRequestSchema = BaseRequestSchema.extend({
  // Allow additional properties for table-specific filtering
  // These will be passed through to the query builder
}).passthrough()

/**
 * Data request schema (generic endpoint)
 */
export const DataRequestSchema = BaseRequestSchema.extend({
  query: z.string().min(1, 'query must not be empty'),
  format: z.enum(['JSONEachRow', 'JSON', 'CSV', 'TSV']).optional(),
})

/**
 * Kill query action schema
 */
export const KillQueryActionSchema = z.object({
  action: z.literal('killQuery'),
  params: z.object({
    queryId: z.string().min(1, 'queryId must not be empty'),
  }),
})

/**
 * Optimize table action schema
 */
export const OptimizeTableActionSchema = z.object({
  action: z.literal('optimizeTable'),
  params: z.object({
    table: z.string().min(1, 'table must not be empty'),
  }),
})

/**
 * Query settings action schema
 */
export const QuerySettingsActionSchema = z.object({
  action: z.literal('querySettings'),
  params: z.object({
    queryId: z.string().min(1, 'queryId must not be empty'),
  }),
})

/**
 * Action schema - discriminated union of all supported actions
 */
export const ActionSchema = z.discriminatedUnion('action', [
  KillQueryActionSchema,
  OptimizeTableActionSchema,
  QuerySettingsActionSchema,
])

/**
 * Export types derived from schemas
 */
export type BaseRequest = z.infer<typeof BaseRequestSchema>
export type ChartRequest = z.infer<typeof ChartRequestSchema>
export type TableRequest = z.infer<typeof TableRequestSchema>
export type DataRequest = z.infer<typeof DataRequestSchema>
export type KillQueryAction = z.infer<typeof KillQueryActionSchema>
export type OptimizeTableAction = z.infer<typeof OptimizeTableActionSchema>
export type QuerySettingsAction = z.infer<typeof QuerySettingsActionSchema>
export type Action = z.infer<typeof ActionSchema>
