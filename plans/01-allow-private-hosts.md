# 01 — Allow private/LAN/Tailscale hosts on self-host

## Problem

The SSRF guard `validateHostUrl` (`apps/dashboard/src/lib/browser-connections/host-url.ts`)
rejects every internal address — private (RFC1918), loopback, link-local, and
**CGNAT `100.64.0.0/10` (Tailscale)** — for ALL deployments. It is not gated by
deployment mode. So a **self-hosted** operator on a homelab cannot add their own
`duet-ubuntu`/LAN/tailnet ClickHouse host through the per-user connection form;
only the trusted `CLICKHOUSE_HOST` env path reaches them.

This violates the project invariant: *"self-hosted stays whole — never gate a
core monitoring feature behind cloud mode."* SSRF protection is essential for the
multi-tenant **cloud**, but on a single-tenant **self-host** the operator IS the
trust boundary and should be able to monitor private clusters via the UI.

## Goal

A self-host operator can set **`CHM_ALLOW_PRIVATE_HOSTS=true`** and then add a
private/LAN/Tailscale ClickHouse host through the connection form. The hosted
**cloud stays locked down** (fail-closed): the flag is ignored when cloud mode is
on, and defaults off everywhere.

## Design (fail-closed)

Add `arePrivateHostsAllowed()` resolved as:

```
allow = parseBool(CHM_ALLOW_PRIVATE_HOSTS) === true
        && !isCloudModeServer()      // cloud ALWAYS blocks, flag can't override
```

- Default (unset) → `false` → current behaviour, OSS build never degraded.
- Cloud mode → always `false` regardless of the flag (multi-tenant safety).
- Self-host + flag true → internal-address rejection is skipped in
  `resolveValidatedHostUrl`; DNS-rebinding/scheme checks still run.

Thread it into `host-url.ts`: the internal-IP rejections (`localhost`,
`isInternalIp(hostname)`, resolved-address check) become conditional on
`!arePrivateHostsAllowed()`. Keep protocol + DNS-resolution + empty-result
checks unconditional.

Centralize via `lib/config/deployment-mode.ts` (it already resolves `CHM_*`
flags) so the value is read once and the env name is documented next to the
others.

## Surfaces to update

- `lib/browser-connections/host-url.ts` — gate the 3 internal-address returns.
- `lib/config/deployment-mode.ts` — add `allowPrivateHosts` to the resolved
  config + `modeDefaults` (oss: false, cloud: false).
- `.env.example` — document `CHM_ALLOW_PRIVATE_HOSTS` (self-host only).
- `lib/connection-errors.ts` — extend the `host_not_allowed` fix text to mention
  the flag for self-hosters.
- Docs: `docs/content/guide/guides/connection-errors.mdx` note.

## Real test

`host-url.test.ts` (extend existing or add):

1. **Default blocks** — with the flag unset, `validateHostUrl('http://192.168.1.10:8123')`,
   a `100.64.x` Tailscale IP, and `http://localhost:8123` all return the
   internal-address error. (Locks current safety.)
2. **Self-host + flag allows** — inject `allowPrivate=true` (via the resolver
   seam, not real env) → the same three now resolve to a valid URL.
3. **Cloud overrides flag** — `allowPrivate` resolver with cloud mode on + flag
   true → still blocked. (This is the security-critical assertion; it must fail
   if someone later lets the flag win in cloud.)

The resolver is injected as a parameter/seam so the test needs no real env
mutation (mirrors how `resolveHostAddresses` is already injected).

## Verification

```
cd apps/dashboard && bun test src/lib/browser-connections/host-url.test.ts
cd apps/dashboard && bun run type-check
```

## Out of scope

- A UI toggle for the flag (it's an operator env decision, not per-user).
- Changing cloud behaviour in any way.
