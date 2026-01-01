## [0.2.0] - 2025-01-01

### Changed
- **BREAKING**: Query configuration format changed from range-based `variants` to chronological `since` format
  - Old: `variants: [{ versions: '<24.1', sql: '...' }]`
  - New: `sql: [{ since: '23.8', sql: '...' }, { since: '24.1', sql: '...' }]`
- Query selection now picks highest `since` version <= current ClickHouse version
- Simplified version matching (no more semver range operators)

### Added
- `VersionedSql` type for version-specific SQL definitions
- `selectVersionedSql()` function for chronological version selection
- Environment-aware version cache adapter with zero-config fallback:
  - Cloudflare Workers KV (when `VERSION_CACHE_KV` binding exists)
  - Redis (when `REDIS_URL` env var is set)
  - In-memory fallback (default, always works)

### Removed
- `QueryConfigVariant` type (replaced by `VersionedSql`) - deprecated, will be removed in v0.3.0
