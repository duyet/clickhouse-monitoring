/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ── No circular dependencies ──────────────────────────────────────────
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies cause hard-to-debug issues.',
      from: {
        pathNot: 'migration/',
      },
      to: { circular: true },
    },

    // ── Packages must not reach into apps ─────────────────────────────────
    {
      name: 'no-packages-to-apps',
      severity: 'error',
      comment:
        'Packages (@chm/*) must not import from apps/. This breaks publishability.',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },

    // ── Apps must not import from other apps ──────────────────────────────
    {
      name: 'no-cross-app-imports',
      severity: 'error',
      comment: 'Apps must not import from other apps.',
      from: { path: '^apps/web/' },
      to: { path: '^apps/mcp/' },
    },
    {
      name: 'no-cross-app-imports-reverse',
      severity: 'error',
      comment: 'Apps must not import from other apps.',
      from: { path: '^apps/mcp/' },
      to: { path: '^apps/web/' },
    },

    // ── Leaf packages must stay leaf-only ─────────────────────────────────
    // @chm/types, @chm/sql-builder, @chm/logger, @chm/platform
    {
      name: 'leaf-packages-no-internal-deps',
      severity: 'error',
      comment:
        'Leaf packages must not depend on higher-layer @chm/* packages.',
      from: {
        path: '^packages/(types|sql-builder|logger|platform)/',
      },
      to: {
        path: '^packages/(clickhouse-client|mcp-server)/',
      },
    },

    // ── @chm/clickhouse-client must not depend on @chm/mcp-server ────────
    {
      name: 'clickhouse-client-layer',
      severity: 'error',
      comment:
        '@chm/clickhouse-client may only depend on leaf packages.',
      from: {
        path: '^packages/clickhouse-client/',
      },
      to: {
        path: '^packages/mcp-server/',
      },
    },
  ],

  options: {
    tsPreCompilationDeps: true,
    doNotFollow: {
      path: 'node_modules',
    },
  },
}
