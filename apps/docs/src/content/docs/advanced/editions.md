---
title: "Editions"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/advanced/editions.mdx"
---

chmonitor is **GPL-3.0 and free forever** for a single operator monitoring their own ClickHouse cluster. Nothing is crippled, nag-screened, or artificially limited in the community build.

The edition system exists to gate features that only matter at team or enterprise scale — features that do not exist yet in the OSS build. A misconfigured or absent edition flag never locks a self-hoster out; the system always fails open to community.

---

## How the edition is selected

The edition is resolved at runtime from one of two variables, checked in order:

| Variable | Where it applies | When to use |
|---|---|---|
| `CHM_EDITION` | Server runtime (Cloudflare Worker `[vars]` / `process.env`) | Canonical; set this in production |
| `VITE_EDITION` | Build-time inline (Vite `CLIENT_ENV`) | Use only if you need the edition baked into the client bundle |

Valid values: `community` (default) or `enterprise`. Any other value — including unset, empty, or a typo — resolves to `community`. The parser never throws.

**Fail-open guarantee:** if `CHM_EDITION` is missing or unrecognised, the edition is `community` and all community features remain fully accessible.

---

## Feature availability

The table below maps STRATEGY §7 capabilities to edition. "Planned" means the feature is on the roadmap but not yet built; the scaffold exists in the codebase but is not functional.

| Capability | Community | Team | Enterprise |
|---|---|---|---|
| All system-table views (health, queries, merges, storage, topology, explorer) | ✓ | ✓ | ✓ |
| AI agent (BYO model key) | ✓ | ✓ | ✓ |
| MCP server (read-only) | ✓ | ✓ | ✓ |
| Single & multi-cluster (manual config) | ✓ | ✓ | ✓ |
| Community config catalog | ✓ | ✓ | ✓ |
| Alerting & notifications (Slack / PagerDuty / webhook) | basic | ✓ planned | ✓ planned |
| Fleet view (many clusters, saved orgs) | — | ✓ planned | ✓ planned |
| Hosted chmonitor Cloud (no deploy) | — | ✓ planned | ✓ planned |
| SSO / SAML | — | — | scaffold (gated, not functional) |
| RBAC | — | — | scaffold (gated, not functional) |
| Audit log, SLA, priority support | — | — | planned |
| Managed AI (hosted model, no BYO key) | — | add-on planned | ✓ planned |

STRATEGY §7 defines the product intent. The "scaffold" rows reflect code that exists in the repository (`lib/auth/sso`, `lib/rbac`) but is behind an edition gate and not yet functional in any build.

---

## Enterprise feature gate

The `isEnabled(feature)` function in `lib/edition/` is the only gate used throughout the codebase. Enterprise features currently gated:

```
alerting  ·  sso  ·  rbac  ·  fleet  ·  cloud
```

Community edition returns `false` for each of these. This does not degrade any community functionality — these features simply do not exist in the OSS build.

---

## Code isolation

Enterprise-only code is isolated so the GPL core never depends on it. The planned boundary is a separate `packages/enterprise/` package that the community build does not import. Today's scaffolds (`lib/auth/sso`, `lib/rbac`) follow the same pattern: they are guarded by `isEnabled()` checks and are inert in community builds.

---

## Summary

- **Community:** everything an individual operator needs to monitor their own cluster. Free, self-hosted, fully functional, no time limit.
- **Team / Enterprise:** team-scale convenience and governance features (alerting, fleet, SSO, RBAC). Most are planned; the scaffolds exist but are not yet functional.
- **Misconfiguration is safe:** an unset or wrong `CHM_EDITION` always falls back to community.

---

## Related

- [Environment Variables](/reference/environment-variables) — full reference for all configuration variables.
- [Feature Permissions](/advanced/feature-permissions) — per-feature access control within an edition.
- [Telemetry](/advanced/telemetry) — opt-in, privacy-first usage metrics (off by default).
