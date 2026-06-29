/**
 * Subscription store — D1 persistence for per-user billing state.
 *
 * Reads degrade gracefully: when the CHM_CLOUD_D1 binding is absent (local dev,
 * self-host) or there is no row, `get()` returns null and the caller falls back
 * to the free plan. Writes require D1 and are only exercised by the Polar webhook
 * (cloud runtime), so they throw if the binding is missing.
 */

import type { PlanId } from './plans'

import { getPlatformBindings } from '@chm/platform'

export interface UserSubscription {
  userId: string
  planId: PlanId
  billingPeriod: 'monthly' | 'yearly' | null
  status: string
  polarSubscriptionId: string | null
  polarCustomerId: string | null
  /** Unix seconds; access valid until then. null for free. */
  currentPeriodEnd: number | null
  createdAt: number
  updatedAt: number
}

export interface UpsertSubscriptionInput {
  userId: string
  planId: PlanId
  billingPeriod: 'monthly' | 'yearly' | null
  status: string
  polarSubscriptionId?: string | null
  polarCustomerId?: string | null
  currentPeriodEnd?: number | null
}

interface D1SubscriptionRow {
  user_id: string
  plan_id: string
  billing_period: string | null
  status: string
  polar_subscription_id: string | null
  polar_customer_id: string | null
  current_period_end: number | null
  created_at: number
  updated_at: number
}

function rowToSubscription(row: D1SubscriptionRow): UserSubscription {
  return {
    userId: row.user_id,
    planId: row.plan_id as PlanId,
    billingPeriod: (row.billing_period as 'monthly' | 'yearly' | null) ?? null,
    status: row.status,
    polarSubscriptionId: row.polar_subscription_id,
    polarCustomerId: row.polar_customer_id,
    currentPeriodEnd: row.current_period_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function getDb() {
  return getPlatformBindings().getD1Database('CHM_CLOUD_D1')
}

/** Read a user's subscription, or null when none / no D1. */
export async function getSubscription(
  userId: string
): Promise<UserSubscription | null> {
  const db = getDb()
  if (!db) return null
  const row = await db
    .prepare(
      `SELECT user_id, plan_id, billing_period, status, polar_subscription_id,
              polar_customer_id, current_period_end, created_at, updated_at
       FROM user_subscriptions WHERE user_id = ?1`
    )
    .bind(userId)
    .first<D1SubscriptionRow>()
  return row ? rowToSubscription(row) : null
}

/** Insert or replace a user's subscription row (idempotent on user_id). */
export async function upsertSubscription(
  input: UpsertSubscriptionInput
): Promise<void> {
  const db = getDb()
  if (!db) {
    throw new Error(
      'CHM_CLOUD_D1 binding not found; cannot persist subscription'
    )
  }
  const now = Math.floor(Date.now() / 1000)
  await db
    .prepare(
      `INSERT INTO user_subscriptions
         (user_id, plan_id, billing_period, status, polar_subscription_id,
          polar_customer_id, current_period_end, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)
       ON CONFLICT(user_id) DO UPDATE SET
         plan_id = excluded.plan_id,
         billing_period = excluded.billing_period,
         status = excluded.status,
         polar_subscription_id = excluded.polar_subscription_id,
         polar_customer_id = excluded.polar_customer_id,
         current_period_end = excluded.current_period_end,
         updated_at = excluded.updated_at`
    )
    .bind(
      input.userId,
      input.planId,
      input.billingPeriod,
      input.status,
      input.polarSubscriptionId ?? null,
      input.polarCustomerId ?? null,
      input.currentPeriodEnd ?? null,
      now
    )
    .run()
}
