/**
 * Subscription store — D1 persistence for billing state.
 *
 * The primary key column is named `user_id` for backward compatibility but now
 * holds the BILLING-OWNER id, which is either a Clerk user id (user_*) or a
 * Clerk org id (org_*). The `owner_type` column ('user'|'org') records which
 * kind, added by migration 0004_subscription_owner.sql.
 *
 * Reads degrade gracefully: when the CHM_CLOUD_D1 binding is absent (local dev,
 * self-host) or there is no row, `getSubscription()` returns null and the caller
 * falls back to the free plan. Writes require D1 and are only exercised by the
 * Polar webhook (cloud runtime), so they throw if the binding is missing.
 */

import type { PlanId } from './plans'

import { error as logError } from '@chm/logger'
import { getPlatformBindings } from '@chm/platform'

export type OwnerType = 'user' | 'org'

export interface UserSubscription {
  /** Billing-owner id — Clerk user id OR Clerk org id. */
  userId: string
  /** 'user' for personal subscriptions; 'org' for org-owned paid plans. */
  ownerType: OwnerType
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
  /** Billing-owner id — Clerk user id OR Clerk org id. */
  userId: string
  /** 'user' for personal subscriptions; 'org' for org-owned paid plans. Default 'user'. */
  ownerType?: OwnerType
  planId: PlanId
  billingPeriod: 'monthly' | 'yearly' | null
  status: string
  polarSubscriptionId?: string | null
  polarCustomerId?: string | null
  currentPeriodEnd?: number | null
}

interface D1SubscriptionRow {
  user_id: string
  owner_type: string | null
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
    ownerType: (row.owner_type as OwnerType | null) ?? 'user',
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

/**
 * Read a subscription by billing-owner id (user id or org id), or null when
 * none exists / no D1 binding.
 *
 * Degrades gracefully (returns null) on ANY D1 error — most importantly a
 * missing `user_subscriptions` table when the binding is provisioned but
 * migrations have not been applied yet. Without this, the raw SELECT throws
 * "no such table" and 500s every billing read; the caller reconciles from
 * Polar / falls back to free instead.
 */
export async function getSubscription(
  ownerId: string
): Promise<UserSubscription | null> {
  const db = getDb()
  if (!db) return null
  try {
    const row = await db
      .prepare(
        `SELECT user_id, owner_type, plan_id, billing_period, status,
                polar_subscription_id, polar_customer_id, current_period_end,
                created_at, updated_at
         FROM user_subscriptions WHERE user_id = ?1`
      )
      .bind(ownerId)
      .first<D1SubscriptionRow>()
    return row ? rowToSubscription(row) : null
  } catch (err) {
    logError('[subscription-store] read failed; treating as no subscription', {
      ownerId,
      err,
    })
    return null
  }
}

/**
 * Insert or replace a subscription row (idempotent on owner id).
 * `input.userId` is the billing-owner id (user or org).
 */
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
  const ownerType: OwnerType = input.ownerType ?? 'user'
  await db
    .prepare(
      `INSERT INTO user_subscriptions
         (user_id, owner_type, plan_id, billing_period, status,
          polar_subscription_id, polar_customer_id, current_period_end,
          created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
       ON CONFLICT(user_id) DO UPDATE SET
         owner_type = excluded.owner_type,
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
      ownerType,
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
