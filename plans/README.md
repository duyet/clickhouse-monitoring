# Plans — cloud plan-benefits parity & follow-ups

This directory holds implementation plans for making the cloud (SaaS) **plan
benefits real, consistent, and tested**, plus two standalone follow-ups raised
in review.

## North-star goal

> Every benefit a plan advertises in `@chm/pricing` is (a) rendered identically
> on the landing pricing page and the in-app billing page, and (b) actually
> enforced at runtime — or explicitly, visibly marked "not yet enforced" with a
> tracking test. No advertised benefit is silently unenforced; no surface drifts
> from the canonical source.

"Fail loud" applies: if a benefit can't be enforced yet, the plan says so and a
test asserts the *current* contract so a future change can't regress it quietly.

## Plans

| # | Plan | Type | Risk |
|---|------|------|------|
| 01 | [allow-private-hosts.md](01-allow-private-hosts.md) | feature (self-host) | low |
| 02 | [plan-benefits-parity.md](02-plan-benefits-parity.md) | correctness + tests | medium |
| 03 | [blog-stat-strip.md](03-blog-stat-strip.md) | copy | trivial |

## How "done" is judged (every plan)

Each plan defines:
- **Goal** — a single measurable outcome.
- **Real test** — a test that *fails today* (or would fail if the behaviour
  regressed) and passes after the change. Not a tautology.
- **Verification** — the exact commands to prove it (build + targeted test).

Testing note (CLAUDE.md): use **Bun test** for unit/logic and **Cypress** for
component/e2e. Jest has known hanging issues — do not add Jest.
