# Skill: verify-deploy (post-deploy self-test)

Verify a **live** dashboard-tsr deployment after every deploy — both the
**unauthenticated** surface (what an anonymous visitor / the CDN sees) and the
**authenticated** surface (token-gated data API actually reaching ClickHouse).

## When to use

- Right after a `chmonitor-dash-tsr` deploy (prod or preview).
- When diagnosing "no data / missing host / blank overview" reports.
- As the gate after any change to env wiring, auth guards, or the build.

## Run it

```bash
# Unauthenticated checks only (no secret needed)
bun apps/dashboard-tsr/scripts/verify-deploy.ts --skip-auth

# Full check incl. ClickHouse connectivity (mints a short-lived chm_ token)
CHM_API_KEY_SECRET=… bun apps/dashboard-tsr/scripts/verify-deploy.ts --hosts 0,1

# Preview deployment, JSON output for CI
bun apps/dashboard-tsr/scripts/verify-deploy.ts \
  --base-url https://preview.dash-tsr.chmonitor.dev --json
```

The secret lives in `apps/dashboard/.env.local` (`CHM_API_KEY_SECRET`) and the
GitHub secret of the same name. Never print it; source it into the env var.

Flags: `--base-url <url>` (default `https://dash-tsr.chmonitor.dev`),
`--hosts 0,1`, `--json`, `--skip-auth`. Exit 0 = all pass, 1 = failures, 2 = harness error.

## What it asserts

**Unauthenticated**
1. `GET /api/health` → 200, reports `runtime / authProvider / clientAuthProvider /
   gitSha / buildTimestamp / clerkPublishableKeyPrefix`.
2. `GET /overview?host=0` → 200 and the HTML references the client entry bundle.
3. **The client entry bundle contains the Clerk `pk_` key when authProvider=clerk.**
   This is the regression guard for the `NEXT_PUBLIC_*` → `VITE_*` migration: a
   broken build inlines NO key (`grep pk_live dist/client` = 0) → Clerk silently
   disabled → no login → no token → the entire data API 401s ("missing data").
4. `GET /api/v1/menu-counts` with no token → 401 when API-key auth is enabled.

**Authenticated** (only when `CHM_API_KEY_SECRET` is set)
5. `POST /api/v1/auth/api-key` with the secret as Bearer → mints a `chm_` token.
   The token is JWT-shaped (`chm_<payload>.<sig>`) — extract the **full** value
   including the `.`; a regex like `chm_[A-Za-z0-9_]+` truncates it → "malformed token".
6. `GET /api/v1/menu-counts?hostId=H` with the token → 200 `success:true` with live
   ClickHouse system-table counts === the worker reaches and queries ClickHouse.
   Runs per host in `--hosts`.

## Notes / gotchas learned

- `/api/v1/data` rejects arbitrary SQL by design (`permission_error`); only the
  registry endpoints (`/api/v1/charts/[name]`, `/api/v1/tables/[name]`,
  `menu-counts`, …) run queries. Use those to prove connectivity.
- The ClickHouse hosts may be **Tailscale Funnel** URLs (`*.ts.net`): from on the
  tailnet MagicDNS gives `100.x` (private), but public DNS resolves the funnel
  ingress and `https://<host>/ping` → 200 — reachable from the CF edge.
- The data API param is `hostId`, not `host`.
