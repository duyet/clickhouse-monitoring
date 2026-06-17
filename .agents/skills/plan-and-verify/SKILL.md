---
name: plan-and-verify
description: "Decompose multi-step tasks into an explicit update_plan checklist, then verify each result before stating it as fact."
---

# Plan-and-Verify

Use this discipline for any task that spans 3 or more distinct actions. The goal is to avoid the two most common agent mistakes: stating a finding before it is confirmed, and losing track of what has actually been done.

## When to Plan

Use `update_plan` when the work genuinely has multiple phases:

- **Investigations**: 3+ queries or tool calls needed to reach a conclusion
- **Changes / recommendations**: any action where a wrong answer has real cost (e.g., index advice, setting change, schema alter)
- **Anomaly diagnosis**: root cause requires cross-checking multiple signals
- **Multi-table analysis**: correlating data across system tables or time windows

Skip it for single-shot answers — if one `query` call settles the question, call it and respond directly. `update_plan` exists to make complex work transparent, not to add ceremony to simple requests.

## Using the `update_plan` Tool

**Call once up front** to lay out the full plan. Set the first step to `in_progress` and every other step to `pending` (omitting `status` defaults to `pending`):

```
update_plan(steps=[
  { title: "Scan query_log for slow queries (last 24 h)", status: "in_progress" },
  { title: "Check merge backlog on affected tables" },
  { title: "Verify finding against a narrower time window" },
  { title: "Summarize confirmed findings" },
])
```

**Call again after each step completes** to advance the checklist. Mark the finished step `completed`, the next one `in_progress`, and leave the rest `pending`:

```
update_plan(steps=[
  { title: "Scan query_log for slow queries (last 24 h)", status: "completed" },
  { title: "Check merge backlog on affected tables",       status: "in_progress" },
  { title: "Verify finding against a narrower window" },
  { title: "Summarize confirmed findings" },
])
```

**Rules:**
- Exactly one step is `in_progress` at any moment.
- Keep plans to ≤ 7 steps. If something needs more, it is two separate tasks.
- Titles are action-oriented and short (≤ 140 chars): "Scan query_log …", "Run EXPLAIN on both versions", "Cross-check baseline".
- Add a `note` field when the current status needs a one-line callout: `note: "High merge backlog confirmed — checking root cause"`.

## The VERIFY Discipline

Produce a result. Then confirm it before reporting it. "Looked right" is not verification.

### Data findings — re-run a tighter query

A wide-window query identifies a candidate. Before calling it a finding, re-run against a narrower window or a second system table to confirm the signal is real and not an artifact of the aggregation window.

```sql
-- Initial: top tables by read_bytes, last 7 days
SELECT tables[1] AS tbl, avg(read_bytes) FROM system.query_log
WHERE event_date >= today() - 7 AND type = 'QueryFinish'
GROUP BY tbl ORDER BY avg(read_bytes) DESC LIMIT 10

-- Verify: same table, last 1 day — does the pattern hold?
SELECT tables[1] AS tbl, count(), avg(read_bytes)
FROM system.query_log
WHERE event_date = today() AND type = 'QueryFinish' AND tables[1] = '<candidate>'
GROUP BY tbl
```

If the narrower window contradicts the wide one, report the discrepancy — do not average the two.

### Query rewrites — compare with EXPLAIN

Never claim a rewrite is "faster" without evidence. Use `explain_query` on both the original and the rewrite. Compare `rows_read` estimates. Report the ratio, not just "better".

```
explain_query(query="SELECT ... -- original")
explain_query(query="SELECT ... -- rewrite")
```

If `rows_read` is identical, the rewrite does not improve scan cost — say so even if the SQL looks cleaner.

### Settings / schema recommendations — state the measurement

A recommendation without a measurable effect is a hypothesis. Every recommendation must include:
1. The expected effect (e.g., "reduces part count in this partition from ~800 to ~200 over one merge cycle")
2. How the user can measure it: the exact query or metric to check before and after

Example: recommending a lower `merge_max_block_size`:
> Expected: smaller memory peaks per merge. Measure: `SELECT max(memory_usage) FROM system.merges` before and ~30 min after applying the setting.

### Anomaly claims — confirm baseline and signal-to-noise

Before flagging a metric as anomalous:
1. Establish the baseline window (e.g., same hour yesterday, or last 7-day average).
2. Confirm the current value exceeds the baseline by a meaningful margin (not just rounding noise).
3. Check whether the anomaly is isolated to one host or cluster-wide.

```sql
-- Baseline: avg query duration same hour yesterday
SELECT avg(query_duration_ms) FROM system.query_log
WHERE type = 'QueryFinish' AND event_time BETWEEN yesterday() + INTERVAL 14 HOUR AND yesterday() + INTERVAL 15 HOUR

-- Current: same hour today
SELECT avg(query_duration_ms) FROM system.query_log
WHERE type = 'QueryFinish' AND event_time >= now() - INTERVAL 1 HOUR
```

If the current value is 1.05× the baseline, it is noise. If it is 4×, it is a finding.

## Reporting: Verified vs. Hypotheses

Always separate what you confirmed from what you inferred.

**Structure your final response as:**

- **Confirmed** — findings backed by at least two data points or a re-run verification query
- **Likely** — single data point, plausible but not cross-checked
- **Hypothesis** — pattern that warrants investigation but was not verified in this session

Never present a hypothesis as a confirmed finding. Surface uncertainty explicitly: "This looks like a merge backlog issue, but I was not able to verify the part count trend — check `system.part_log` to confirm."

## Worked Example: 4-Step Investigation

**Request**: "Why are queries on `events` slow since yesterday afternoon?"

**Step 1 — Plan**
```
update_plan(steps=[
  { title: "Scan query_log for slow queries on events (last 48 h)", status: "in_progress" },
  { title: "Check part count and merge backlog on events" },
  { title: "Verify: narrow window + cross-check parts growth" },
  { title: "Report confirmed findings with measurement guidance" },
])
```

**Step 2 — Scan query_log**  
Query returns: `avg(query_duration_ms)` jumped from 420 ms to 3 100 ms starting at 14:00 yesterday. First guess: memory pressure.

**Step 3 — Check merge backlog**  
`get_merge_status` shows 0 active merges. `system.parts WHERE table = 'events' AND active = 1` returns 1 840 parts — unusually high. This contradicts the memory-pressure guess.

**Step 4 — Verify**  
Re-run with `event_time >= yesterday() + INTERVAL 13 HOUR` (one hour before the slowdown). Parts were 340 at 13:00, grew to 1 840 by 15:00. The part explosion matches a batch insert job. Memory pressure ruled out.

```
update_plan(steps=[
  { title: "Scan query_log for slow queries on events (last 48 h)", status: "completed" },
  { title: "Check part count and merge backlog on events",           status: "completed" },
  { title: "Verify: narrow window + cross-check parts growth",       status: "completed" },
  { title: "Report confirmed findings with measurement guidance",    status: "in_progress" },
])
```

**Report:**
- **Confirmed**: Part count on `events` grew from ~340 to ~1 840 between 13:00 and 15:00 yesterday, correlating directly with the query slowdown (4× duration increase). Caused by a high-frequency insert job creating many small parts.
- **Recommendation**: Merge parts with `OPTIMIZE TABLE events PARTITION <partition> FINAL` (off-peak). Then reduce insert frequency or batch larger inserts. Measure: `SELECT count() FROM system.parts WHERE table = 'events' AND active = 1` — should drop below 400 after merge completes.
- **Hypothesis** (not verified): the insert job may be running on a fixed schedule — check `system.query_log WHERE query LIKE '%INSERT INTO events%'` grouped by hour to confirm recurrence.

## Cross-references

- `anomaly-detection` — baseline calculation patterns and signal thresholds
- `query-tuning-advisor` — EXPLAIN interpretation and rewrite patterns
- `troubleshooting` — error-code diagnosis workflows that pair well with this loop
