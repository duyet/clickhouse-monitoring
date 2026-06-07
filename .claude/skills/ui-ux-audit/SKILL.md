---
name: ui-ux-audit
description: >-
  Automated UI/UX + accessibility audit for the ClickHouse Monitor dashboard
  (apps/dashboard-tsr). Use this whenever the user wants to "test all pages",
  "audit the dashboard", "find UI/UX issues", "check accessibility / a11y",
  "spot visual regressions", "screenshot every route", "reproduce a UI bug", or
  asks to verify the dashboard UI after a change or deploy. It sweeps every
  dashboard route headlessly, captures console errors + failed network calls,
  runs axe-core accessibility scans, detects layout overflow and stuck loading
  skeletons, diffs screenshots against a baseline for visual regression, and
  emits a runnable repro (trace.zip + script) for each issue so it can be
  replayed on demand. Runs against the local dev server (auth bypassed) by
  default, or the live Clerk-protected deployment using the stored test session.
  Prefer this over ad-hoc one-off Playwright scripts for any multi-page UI check.
---

# ClickHouse Monitor — UI/UX Audit

This skill drives a real browser over **every dashboard route** and reports the
UI/UX problems that matter, with a reproducible artifact for each one. It exists
because the dashboard has ~85 routes; eyeballing them by hand misses regressions
(a tab-switch freeze, a chart that overflows on one page, an a11y violation that
only appears in an empty state). A scripted sweep catches the whole class at once.

## When to reach for it

Trigger on requests like "test all the pages", "audit the dashboard UI", "find
accessibility issues", "did my change break any page", "screenshot every route",
"check for visual regressions", or "reproduce that UI bug". It is the right tool
any time the surface under test is *more than one or two pages*.

## Mental model — why two targets

The dashboard is **auth-aware, not auth-walled**: the shell, nav, and most pages
render for anonymous users; only data calls are gated. That gives two useful
targets:

- **local** (default): `apps/dashboard-tsr` running with `VITE_AUTH_PROVIDER=none`.
  Auth is fully bypassed, and `.env.local` points at a real ClickHouse, so you get
  *data-bearing* states (real charts, tables) with zero login friction. Best for
  catching structural/a11y/console-error/regression issues. CI-friendly.
- **live**: `https://dash-tsr.chmonitor.dev`, which runs **pk_live Clerk**. The
  audit reuses a stored browser session (`~/.config/chmonitor/clerk-state.json`)
  from the dedicated test account, so it can exercise the *production auth path*
  and authorized data without logging in each run. Use this to verify prod-only
  states and post-deploy smoke. (See the `test-account-clerk` memory for how that
  session was created and refreshed — Clerk's Turnstile means the session must be
  minted with a **headed** browser; the audit itself runs headless off the cookie.)

## One-time setup

Install the toolchain (Playwright + axe-core + image-diff) outside the repo:

```bash
bash .claude/skills/ui-ux-audit/scripts/setup.sh
```

It installs into `~/.config/chmonitor/qa-tools` and downloads Chromium. Idempotent.

## Running an audit

Always run from the tools dir so `playwright` resolves:

```bash
cd ~/.config/chmonitor/qa-tools

# Local sweep (default) — start the dev server first (see below)
bun ~/project/clickhouse-monitor/.claude/skills/ui-ux-audit/scripts/audit.mjs --target=local

# Just a couple of routes (fast iteration / reproduction)
bun .../audit.mjs --target=local --only=/explorer,/sql,/overview

# Live deployment, reusing the Clerk test session
bun .../audit.mjs --target=live

# Visual regression: pass a previous run's shots/ as the baseline
bun .../audit.mjs --target=local --baseline=/tmp/chm-ui-audit/local-<prev>/shots
```

### Local dev server

The **local** target needs the dev server up with auth disabled. `.env.local`
already sets `VITE_AUTH_PROVIDER=none`. Start it and wait for the port:

```bash
cd ~/project/clickhouse-monitor/apps/dashboard-tsr && bun run dev
```

Vite prints the actual URL (usually `http://localhost:3000`). If it differs,
pass it: `BASE_URL=http://localhost:5173 bun .../audit.mjs`.

### Useful flags

| Flag | Default | Meaning |
|------|---------|---------|
| `--target=local\|live` | `local` | which deployment to audit |
| `--only=/a,/b` | all routes | restrict to specific routes (auto-discovers all otherwise) |
| `--baseline=<dir>` | none | screenshot dir to diff against for visual regression |
| `--host=N` | `0` | ClickHouse host id (`?host=`) |
| `--a11y=off` | on | skip the axe-core accessibility scan |
| `--settle=ms` | `3500` | wait after load for charts/data to render before checking |
| `--headed` | off | watch the run in a visible window |
| `--out=<dir>` | `/tmp/chm-ui-audit/...` | output directory |

## What it checks per route

Routes are **auto-discovered** by scanning `apps/dashboard-tsr/src/routes`
(TanStack Start file routing — pathless `(group)` dirs, `route.tsx` layouts,
`-`/`_` private files, and `$param` dynamic routes are handled). For each route:

- **console errors** + uncaught `pageerror` (high) — the tab-switch-freeze class.
- **failed network calls** (>=400, minus known-noisy ones).
- **accessibility** via axe-core (WCAG 2 A/AA), reporting only `serious`/`critical`.
- **horizontal overflow** — page wider than the viewport, with the offending nodes.
- **stuck skeletons** — loading placeholders still present after settle (dead query).
- **error states** — "something went wrong" / "is not a constructor" rendered text.
- **visual regression** — pixel diff vs a baseline screenshot (when provided).

## Output & reproduction

Everything lands in `--out` (printed at the end):

- `report.html` — open this first. Grouped by route, severity-colored, screenshots
  inline, with the exact repro command per route.
- `report.json` — machine-readable findings (feed to follow-up automation).
- `shots/` — full-page screenshot of every route (also the next run's baseline).
- `diffs/` — visual-regression diff images.
- `traces/<route>.zip` — Playwright trace for routes **with findings**. Replay the
  exact session: `bun x playwright show-trace traces/<route>.zip`.
- `repro/<route>.mjs` — a standalone, headed Playwright script that re-opens the
  route, prints the console errors, and leaves the browser open 60s to inspect.
  This is the "reproduce it when needed" artifact — hand it to anyone.

## Interpreting results

- On **local**, some `failed-request` findings can be benign (a ClickHouse table
  missing on the dev instance). Triage against the route's purpose before filing.
- `a11y` findings cite the WCAG rule id and a `helpUrl` — fix at the component, not
  in `components/ui/` (shadcn primitives stay pristine; style at the usage site).
- Treat **console-error** and **error-state** on a previously-clean route as a real
  regression — that is exactly the signal that caught the explorer tab-switch crash.

## Refreshing the live session

The live target reuses a **persistent browser profile** at
`~/.config/chmonitor/clerk-userdata` (it keeps Clerk's full client state, unlike a
storageState snapshot whose short-lived JWT expires). Populate or refresh it with
the headed login helper (headed because pk_live Turnstile only auto-passes in a
real browser window):

```bash
bun .claude/skills/ui-ux-audit/scripts/live-login.mjs   # HEADLESS=0 by default
```

It signs the dedicated test account in and writes the profile; `audit.mjs
--target=live` then runs headless off it. If a verification code is required, it is
emailed to `duyet.cs@gmail.com` (plus-addressed) — read it via the Gmail MCP and
write the 6 digits to `/tmp/chm-otp.txt`; the helper polls that file. Full account
details live in the `test-account-clerk` memory note.

> Note: on a deployment where the client is built with `VITE_AUTH_PROVIDER=none`
> (no Clerk mounted client-side), there is no in-app sign-in and the live target is
> audited as an anonymous Guest — structure/a11y/visual coverage only, data calls
> may 401 depending on the server's `CHM_AUTH_PROVIDER`.
