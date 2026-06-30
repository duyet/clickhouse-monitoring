# 02 — Plan-benefits parity: advertised ⟺ enforced (or explicitly deferred)

## Current reality (audited)

Only **one** advertised benefit is enforced in code: the **host cap**
(`routes/api/v1/user-connections.ts` → `checkHostLimit` → pooled by
`countOwnerHosts`). Everything else is advertised in `@chm/pricing` and
unit-tested in isolation, but **wired to no runtime gate**:

| Benefit | Advertised | Enforced today |
|---|---|---|
| `hosts` | yes | **YES** (`user-connections.ts`) |
| `seats` | yes | no — `checkSeatLimit` has no caller |
| `alertRules` | yes | no — no alert-rule route even exists |
| `retentionDays` | yes | no — conversations/insights never pruned by plan |
| `aiRequestsPerDay` | yes | no — agent route never counts/gates |
| `aiMonthlyUsdBudget` / `aiOverage` | yes | no — spend never metered |
| 13 `PlanCapability` flags | yes | no — none mapped to a gate; used only to render the matrix |

`PlanCapability` (e.g. `alerting_basic`, `fleet_view`, `sso_rbac_audit`) and the
existing gating systems (`lib/edition` `ENTERPRISE_FEATURES`,
`lib/feature-permissions`) are **completely decoupled** — different string names,
no mapping.

## The product constraint that shapes this

The pricing page states **"Early access — free while in beta"** and Free carries
an "Early access" badge. Therefore **per-tier feature enforcement must NOT be
switched on now** — doing so would remove features current users already enjoy,
breaking the beta promise and the "self-hosted/OSS stays whole" + "never remove a
feature" invariants. Host-cap enforcement is the deliberate exception (it caps a
cost/abuse vector without removing a capability).

So "parity" right now = **codify the contract and lock it with tests**, not
"gate everything." Enforcement is *staged* behind an explicit, tested registry so
it can be switched on at GA without a scavenger hunt.

## Goal

1. A single **capability/limit enforcement registry** is the source of truth for
   *whether each advertised benefit is enforced yet* — every `PlanCapability`
   and every numeric limit is classified `enforced | deferred | inherent`, with
   a reason and (when enforced) a pointer to the gate.
2. **Drift is impossible to ship silently**: tests fail if (a) a new capability
   is added without classifying it, (b) the landing matrix and the in-app matrix
   disagree, or (c) an "enforced" claim has no gate.
3. The two surfaces (landing + dashboard) render benefits from the **same**
   `@chm/pricing` data (already true after the centralization) — now *asserted*.

This plan does NOT turn on feature gating (free beta). It makes the contract
real, visible, and regression-proof, and implements the safe enforcement.

## Implement now

### A. Enforcement registry — `apps/dashboard/src/lib/billing/plan-enforcement.ts`

```ts
type Enforcement =
  | { status: 'enforced'; gate: string }   // file:fn that enforces it
  | { status: 'deferred'; reason: string } // advertised, GA/roadmap
  | { status: 'inherent' }                 // not software-gated (support, core)

export const CAPABILITY_ENFORCEMENT: Record<PlanCapability, Enforcement>
export const LIMIT_ENFORCEMENT: Record<
  'hosts'|'seats'|'alertRules'|'retentionDays'|'aiRequestsPerDay', Enforcement>
```

- `hosts` → `{ status:'enforced', gate:'user-connections.ts handlePost / checkHostLimit' }`
- `core_monitoring`, `priority_support` → `inherent`
- everything else → `deferred` with a one-line reason ("free during early
  access; gate at GA") so the empty promise is explicit, not hidden.

### B. Parity tests — `plan-enforcement.test.ts` + extend `plans.test.ts`

Real tests (each fails if the contract regresses):

1. **Total coverage** — `CAPABILITY_ENFORCEMENT` has an entry for *every*
   `PlanCapability` (and the limit map for every limit key). Add a capability to
   `@chm/pricing` without classifying it → **fails**. (This is the anti-drift
   guard.)
2. **Enforced claims are honest** — every `status:'enforced'` entry has a
   non-empty `gate` string. (You can't mark something enforced without naming
   where.)
3. **Cross-surface parity** — assert the dashboard comparison rows and the
   landing comparison rows produce identical strings for each shared limit, by
   importing the shared `@chm/pricing` display helpers and comparing
   `planHosts/planSeats/planAlertRules/planRetention/planAiUsage` for all four
   tiers against the literal values the matrices claim. (Catches a future
   hard-coded divergence.)
4. **Host cap really blocks** (integration-ish, pure): given a Pro plan and
   `usedHosts = plan.hosts`, `checkHostLimit(...).allowed === false`; at
   `hosts-1` it's true. (Locks the one enforced path.)

### C. Wire the next-safe limit: nothing that removes a feature

The only enforcement safe to add in beta beyond hosts is **abuse/cost caps**, and
the AI daily-message cap needs a per-owner per-day counter store that does not
exist yet — that is its own feature (see roadmap). So **no new gating is switched
on in this plan.** The registry marks `aiRequestsPerDay`, `seats`, `alertRules`,
`retentionDays` as `deferred` with the concrete next step recorded below.

## Staged enforcement roadmap (each: goal + real test, NOT built here)

Recorded so they're tracked, not lost. Implement per-item when GA pricing turns on.

- **AI daily message cap** — Goal: agent message route 429s once
  `requestsToday >= plan.aiRequestsPerDay` for `deferred→enforced`. Needs a
  per-owner daily counter (D1 `ai_usage_daily`). Test: route returns 429 at the
  cap, 200 below; Pro/Max soft-cap (overage) returns 200 past cap.
- **Seat cap** — Goal: block org-member invite past `plan.seats`. Needs a Clerk
  `organizationMembership.created` webhook that counts members vs the owner's
  plan. Test: webhook handler rejects/flags the (seats+1)th member.
- **Retention** — Goal: conversations/insights older than `plan.retentionDays`
  excluded from reads + pruned by cron. Test: a row older than the cutoff is not
  returned for a Free (7-day) owner.
- **Alert rules** — blocked on the alerting feature existing at all; classify
  `deferred` until then.
- **Capability gates (data_export, anomaly_detection, fleet_view, …)** — Goal: a
  `requirePlanCapability(cap)` server gate + UI lock, switched on at GA. Test:
  gate denies a Free owner, allows a Max owner. Map `PlanCapability` →
  `feature-permissions` here.

## Verification

```
cd apps/dashboard && bun test src/lib/billing/
cd apps/dashboard && bun run type-check
```

## Why staged, not all-on (summary)

Switching feature gates on during free early access removes capabilities from
current users. The registry + tests make the *promise* truthful and
drift-proof now; flipping `deferred→enforced` is a one-line registry change plus
the per-item wiring above, each with its test, done when paid GA launches.
