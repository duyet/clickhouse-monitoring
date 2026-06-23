# Changelog

All notable changes to this project are documented in this file. Versioned
entries are generated automatically by [release-please](.github/workflows/release-please.yml)
from conventional commits; the `Unreleased` section below is a human-curated
preview of the next release.

## [0.2.11](https://github.com/duyet/clickhouse-monitoring/compare/v0.2.10...v0.2.11) (2026-06-23)


### ✨ Features

* **agent:** persist MCP server config to localStorage ([#1833](https://github.com/duyet/clickhouse-monitoring/issues/1833)) ([723f7b3](https://github.com/duyet/clickhouse-monitoring/commit/723f7b33b65420ecb607ebb843bff4efab6dad67))
* **ai-insights:** redesign panel + persist & auto-load insights + settings link ([#1819](https://github.com/duyet/clickhouse-monitoring/issues/1819)) ([bc9d633](https://github.com/duyet/clickhouse-monitoring/commit/bc9d633bb7163890d8b2a88fde35ef0d508b4f30))
* **alerts:** browser notifications on by default (out-of-box, opt-out) ([#1858](https://github.com/duyet/clickhouse-monitoring/issues/1858)) ([6a21a28](https://github.com/duyet/clickhouse-monitoring/commit/6a21a2846d7ead4e15c5aba5f9120816408ff81c))
* **auth:** add 'trusted' reverse-proxy auth mode with forwarded identity ([#1755](https://github.com/duyet/clickhouse-monitoring/issues/1755)) ([094391a](https://github.com/duyet/clickhouse-monitoring/commit/094391a60df8c99dd0fc371c85932c32e85de587))
* **auth:** show "via trusted proxy" source label in sidebar user menu ([#1824](https://github.com/duyet/clickhouse-monitoring/issues/1824)) ([3193f89](https://github.com/duyet/clickhouse-monitoring/commit/3193f895998e1d2bce4393d213c2bc3bfda9803b))
* **expensive-queries:** total-time sort, metric bars, and cluster-load summary ([#1827](https://github.com/duyet/clickhouse-monitoring/issues/1827)) ([f7d3830](https://github.com/duyet/clickhouse-monitoring/commit/f7d3830bcc28f1e0f1b8e9922a8f3654249b1515))
* **explain:** syntax highlighting, FORMAT/semicolon tolerance, multi-query tabs ([#1826](https://github.com/duyet/clickhouse-monitoring/issues/1826)) ([41e8e8b](https://github.com/duyet/clickhouse-monitoring/commit/41e8e8bc984bd5ee3d7979c717ff9af9c90d28e3))
* **insights-settings:** redesign page — searchable model picker w/ provider icons + docs links ([#1820](https://github.com/duyet/clickhouse-monitoring/issues/1820)) ([8be8555](https://github.com/duyet/clickhouse-monitoring/commit/8be8555133ca8ea9b6c393b19b615e760ce3255f))
* **insights:** add AI insights panel to /insights page, merge plans into docs ([2ba9fe4](https://github.com/duyet/clickhouse-monitoring/commit/2ba9fe49180c9fe917009363a044378f2d3514ea))
* **insights:** AI Insights settings page + panel link, wired into generation ([#1782](https://github.com/duyet/clickhouse-monitoring/issues/1782)) ([6bfd0aa](https://github.com/duyet/clickhouse-monitoring/commit/6bfd0aa34d6eb37af5d9ecbd595890be17a9a152))
* **insights:** configurable AI insight generation (model, prompt style, enrichment) ([#1767](https://github.com/duyet/clickhouse-monitoring/issues/1767)) ([8ef2977](https://github.com/duyet/clickhouse-monitoring/commit/8ef2977a186dd4a5b1cd24c270acb2e6ed4cf3c8))
* **insights:** global AI Insights header popover on every page ([#1783](https://github.com/duyet/clickhouse-monitoring/issues/1783)) ([c04f2fa](https://github.com/duyet/clickhouse-monitoring/commit/c04f2fa1653d3e4add070e4c1259dc0798f9d6da))
* **insights:** pluggable AI Insights storage backends ([#1797](https://github.com/duyet/clickhouse-monitoring/issues/1797)) ([7cdd146](https://github.com/duyet/clickhouse-monitoring/commit/7cdd146a6d175aad8d74c185c5b2858896b1a08b))
* **insights:** preview generation with current settings on the settings page ([#1786](https://github.com/duyet/clickhouse-monitoring/issues/1786)) ([039a5d2](https://github.com/duyet/clickhouse-monitoring/commit/039a5d2c6dae1312dd290fb6d77e9dcf7075c9ec))
* **insights:** redesign settings — templates, icon grid, side-by-side live example ([#1790](https://github.com/duyet/clickhouse-monitoring/issues/1790)) ([5f2e3dc](https://github.com/duyet/clickhouse-monitoring/commit/5f2e3dc5e2cd78480b94faaba54d81077e4e55c7))
* **insights:** surface enrichment availability + default model in settings ([#1787](https://github.com/duyet/clickhouse-monitoring/issues/1787)) ([463c825](https://github.com/duyet/clickhouse-monitoring/commit/463c8255e3da190487f75a84ba8b448eb29f7029))
* **seo:** complete docs icon set + add robots.txt to docs & dashboard ([#1837](https://github.com/duyet/clickhouse-monitoring/issues/1837)) ([0062a09](https://github.com/duyet/clickhouse-monitoring/commit/0062a09d7c49ab5dad549c4f13f4a708154d0e5a))
* **seo:** keyword-rich descriptions + schema.org structured data ([#1838](https://github.com/duyet/clickhouse-monitoring/issues/1838)) ([e4f832f](https://github.com/duyet/clickhouse-monitoring/commit/e4f832f00c442a9791384788f5a467afeff21ba2))
* **sql-console:** multi-query results, database picker, tree sidebar, buttons below editor ([#1822](https://github.com/duyet/clickhouse-monitoring/issues/1822)) ([e5de0a8](https://github.com/duyet/clickhouse-monitoring/commit/e5de0a878e17af878870fd9567f36de17ac5a603))
* **ui:** overview design pass — palette, cards, chart colors, heatmap ([#1836](https://github.com/duyet/clickhouse-monitoring/issues/1836)) ([b148009](https://github.com/duyet/clickhouse-monitoring/commit/b14800987ecee5663df5886a9c12c0f8c56e1a34))


### 🐛 Bug Fixes

* **a11y:** add aria-labels to icon-only buttons ([#1874](https://github.com/duyet/clickhouse-monitoring/issues/1874)) ([cf930ab](https://github.com/duyet/clickhouse-monitoring/commit/cf930abafca2a2456a1821108eb17ebb0b97e1f7))
* **agent-api:** gate unconditional debug logs behind AGENT_DEBUG_LOGS ([#1791](https://github.com/duyet/clickhouse-monitoring/issues/1791)) ([e15cd7a](https://github.com/duyet/clickhouse-monitoring/commit/e15cd7a5653e6d4dda55c5182fc2067a76a2b655))
* **agent:** explain_query use EXPLAIN PLAN indexes=1 for indexes mode ([#1781](https://github.com/duyet/clickhouse-monitoring/issues/1781)) ([25795e5](https://github.com/duyet/clickhouse-monitoring/commit/25795e5b6c76f79b705e1d03d55d66ff0588d90d))
* **agent:** explore_table_schema query valid system.parts columns ([#1780](https://github.com/duyet/clickhouse-monitoring/issues/1780)) ([e8d6f6c](https://github.com/duyet/clickhouse-monitoring/commit/e8d6f6cb1e4b897427ba42ccb18dfa53668ddadb))
* **agents:** wire MCP panel status to real /api/v1/mcp/info data ([#1831](https://github.com/duyet/clickhouse-monitoring/issues/1831)) ([03ca2d8](https://github.com/duyet/clickhouse-monitoring/commit/03ca2d858515256e3549bbe1fc48678d2c90f2ff))
* **api:** gate /api/health metadata on genuine auth, not public-read ([#1834](https://github.com/duyet/clickhouse-monitoring/issues/1834)) ([a61dfc6](https://github.com/duyet/clickhouse-monitoring/commit/a61dfc67120d11e320d613d71c52ec4e040cbee9))
* **api:** harden actions/explain/explorer input & output handling ([#1785](https://github.com/duyet/clickhouse-monitoring/issues/1785)) ([4f1b4ea](https://github.com/duyet/clickhouse-monitoring/commit/4f1b4ea6ef8f90b7058816c48e2c388acf32ac85))
* **api:** hide deployment metadata from anonymous /api/health callers ([#1829](https://github.com/duyet/clickhouse-monitoring/issues/1829)) ([f0905ee](https://github.com/duyet/clickhouse-monitoring/commit/f0905eef41fb9ae50169de35b31749d860c03cbc))
* **api:** reject negative and fractional hostId at route boundary ([#1760](https://github.com/duyet/clickhouse-monitoring/issues/1760)) ([214389c](https://github.com/duyet/clickhouse-monitoring/commit/214389c094a0b664013c61241f5f9c3489070e09))
* **api:** return 503/504 for unreachable ClickHouse upstream, not 500 ([#1840](https://github.com/duyet/clickhouse-monitoring/issues/1840)) ([2064493](https://github.com/duyet/clickhouse-monitoring/commit/2064493edb200585f9ab2d5f11aca6df7ba90cd1))
* **api:** return 503/504 for unreachable ClickHouse upstream, not 500 ([#1841](https://github.com/duyet/clickhouse-monitoring/issues/1841)) ([1412df1](https://github.com/duyet/clickhouse-monitoring/commit/1412df1092a9eea440ace7023d2caf8034cafb14))
* **auth:** gate sidebar identity on runtime auth provider, not build-time ([#1812](https://github.com/duyet/clickhouse-monitoring/issues/1812)) ([ee77b94](https://github.com/duyet/clickhouse-monitoring/commit/ee77b94750ca968ffaa819d070f2f41599261a3c))
* **ci:** label apps/dashboard as 'app: dashboard', not legacy ([#1886](https://github.com/duyet/clickhouse-monitoring/issues/1886)) ([3949b3a](https://github.com/duyet/clickhouse-monitoring/commit/3949b3ae14bace0346e1a37f2447800d5c167633))
* **ci:** retry transient Cloudflare 10215 conflict when setting worker secrets ([#1896](https://github.com/duyet/clickhouse-monitoring/issues/1896)) ([d7d2872](https://github.com/duyet/clickhouse-monitoring/commit/d7d287219101d6536a25f647a20a52db79b046a0))
* **ci:** skip dashboard deploy steps for dependabot PRs ([#1835](https://github.com/duyet/clickhouse-monitoring/issues/1835)) ([bcc1fc8](https://github.com/duyet/clickhouse-monitoring/commit/bcc1fc8cee194040821225dcb834c98ab2f90177)), closes [#1809](https://github.com/duyet/clickhouse-monitoring/issues/1809)
* **clickhouse-client:** default to web client on all runtimes (Docker fix) ([#1752](https://github.com/duyet/clickhouse-monitoring/issues/1752)) ([a1970ed](https://github.com/duyet/clickhouse-monitoring/commit/a1970ed0557aac7ff1fe6b63e9553e583bcf5536))
* **clickhouse-client:** honor versioned queryConfig.sql[] in fetchJsonEachRowAsNormalizedJson ([#1806](https://github.com/duyet/clickhouse-monitoring/issues/1806)) ([b1fb977](https://github.com/duyet/clickhouse-monitoring/commit/b1fb9770950d903661905f5c3dc78d2c3aa8a340))
* **dashboard-storage:** remove dead [@ts-expect-error](https://github.com/ts-expect-error) directives ([7f420ae](https://github.com/duyet/clickhouse-monitoring/commit/7f420ae265807d3cabbb012edd06c9d831adfdb3))
* **dashboard:** repair dev-mode crashes + UI/UX audit a11y/error fixes ([#1814](https://github.com/duyet/clickhouse-monitoring/issues/1814)) ([fc2e66d](https://github.com/duyet/clickhouse-monitoring/commit/fc2e66d2115e808e1e8513b6b993a4a2b67faebf))
* **insights:** render generated insights immediately, independent of persistence ([#1792](https://github.com/duyet/clickhouse-monitoring/issues/1792)) ([6855eb8](https://github.com/duyet/clickhouse-monitoring/commit/6855eb890ad2ff56d81ab61974253d07105a917a))
* **lint:** apply biome auto-fixes to test files ([9efa76f](https://github.com/duyet/clickhouse-monitoring/commit/9efa76f99c2c566be6415fe9d622685eaa9dc021))
* **mcp:** secure-by-default — deny anonymous access unless CHM_MCP_PUBLIC=true ([#1830](https://github.com/duyet/clickhouse-monitoring/issues/1830)) ([5109f56](https://github.com/duyet/clickhouse-monitoring/commit/5109f5681fd70b7523e7c53e90ba7b119533f72a))
* **mutations:** redesign sparse summary cards with denser hierarchy + empty state ([#1817](https://github.com/duyet/clickhouse-monitoring/issues/1817)) ([1e612f1](https://github.com/duyet/clickhouse-monitoring/commit/1e612f17a823b37552c17da463341c02d0beac51))
* **query-config:** query-metric-log 500 on modern ClickHouse (aggregate alias in WHERE) ([#1815](https://github.com/duyet/clickhouse-monitoring/issues/1815)) ([32d2d34](https://github.com/duyet/clickhouse-monitoring/commit/32d2d34c7953473df7c999853177850b79fbed6a))
* **query-config:** query-metric-log 500 on modern ClickHouse (aggregate alias in WHERE) ([#1816](https://github.com/duyet/clickhouse-monitoring/issues/1816)) ([72544d0](https://github.com/duyet/clickhouse-monitoring/commit/72544d0de712ae3af2c3e57ec14b9c9a668d7acc))
* **security:** constant-time CRON_SECRET comparison in health-sweep ([#1893](https://github.com/duyet/clickhouse-monitoring/issues/1893)) ([72f93b2](https://github.com/duyet/clickhouse-monitoring/commit/72f93b23379b24b4e4a422e4f3a30908765d74ea))
* **security:** redact ClickHouse error details from action API responses ([#1894](https://github.com/duyet/clickhouse-monitoring/issues/1894)) ([6f20ae9](https://github.com/duyet/clickhouse-monitoring/commit/6f20ae933d916adb01472ee189050fb155271cba))
* **seo:** inject JSON-LD via effect to avoid hydration mismatch ([#1839](https://github.com/duyet/clickhouse-monitoring/issues/1839)) ([f0da6bc](https://github.com/duyet/clickhouse-monitoring/commit/f0da6bc9b4e94fcd4baa3fe6631311e3292eba7c))
* **sql-builder:** add splitSqlStatements source for orphaned test on main ([#1821](https://github.com/duyet/clickhouse-monitoring/issues/1821)) ([c4355ba](https://github.com/duyet/clickhouse-monitoring/commit/c4355bad43c408d5a0929bc80c8596b7b7461b52))
* **sql-builder:** only strip trailing FORMAT for known ClickHouse formats ([#1828](https://github.com/duyet/clickhouse-monitoring/issues/1828)) ([a5fded5](https://github.com/duyet/clickhouse-monitoring/commit/a5fded54dac1e1cd70fff42c68d41a39f1d25bb2))
* **sql-validator:** stop rejecting legitimate read-only queries ([#1758](https://github.com/duyet/clickhouse-monitoring/issues/1758)) ([ee4894b](https://github.com/duyet/clickhouse-monitoring/commit/ee4894be88fa684053ab44326fb79f3871965289))
* **ui:** align chart skeleton min-height to loaded chart to cut CLS ([#1865](https://github.com/duyet/clickhouse-monitoring/issues/1865)) ([8adc563](https://github.com/duyet/clickhouse-monitoring/commit/8adc5636c0fcd59d2f14b21aa435247a3bad44c2))
* **ui:** prevent mobile horizontal overflow on toolbar + explain tabs ([#1864](https://github.com/duyet/clickhouse-monitoring/issues/1864)) ([9eb5216](https://github.com/duyet/clickhouse-monitoring/commit/9eb5216eb042ba9d63ac9c430e5e245ee62e992f))
* **ui:** tabular-nums on live/columnar numeric displays ([#1875](https://github.com/duyet/clickhouse-monitoring/issues/1875)) ([9713041](https://github.com/duyet/clickhouse-monitoring/commit/9713041cc6b6f0141c618fa0ede32538bc739ac1))


### ⚡ Performance

* **charts:** lazy-load chart-error diagnostics dialog (react-markdown) ([#1877](https://github.com/duyet/clickhouse-monitoring/issues/1877)) ([1a5fb4a](https://github.com/duyet/clickhouse-monitoring/commit/1a5fb4ae817fb9e6f46c5b5c99dc1d66d72b8872))
* **charts:** use REFRESH_INTERVAL presets for refresh intervals ([#1772](https://github.com/duyet/clickhouse-monitoring/issues/1772)) ([#1811](https://github.com/duyet/clickhouse-monitoring/issues/1811)) ([4192e50](https://github.com/duyet/clickhouse-monitoring/commit/4192e50286f4c49eac98b2871ab63007acdaf9e0))
* **data-table:** memoize render-path allocations ([#1771](https://github.com/duyet/clickhouse-monitoring/issues/1771)) ([#1810](https://github.com/duyet/clickhouse-monitoring/issues/1810)) ([72c6273](https://github.com/duyet/clickhouse-monitoring/commit/72c6273873c123cb205c1bc55105f07599e808e5))
* **keeper:** memoize cluster grouping + React.memo NodeCard ([#1876](https://github.com/duyet/clickhouse-monitoring/issues/1876)) ([332252d](https://github.com/duyet/clickhouse-monitoring/commit/332252d4b913007390f8d0a6d3ff2cd876350282))
* **overview:** memoize OverviewChart and tab chart filters ([#1895](https://github.com/duyet/clickhouse-monitoring/issues/1895)) ([5be08c4](https://github.com/duyet/clickhouse-monitoring/commit/5be08c4b002a0eb7107acd94f3dd4d2c9871921b))
* **running-queries:** memoize chart transforms with useMemo ([#1857](https://github.com/duyet/clickhouse-monitoring/issues/1857)) ([1595ed1](https://github.com/duyet/clickhouse-monitoring/commit/1595ed1d279a9371842709c3bcb39e78a7499769))


### ♻️ Refactoring

* **charts:** collapse charts to compact row instead of hiding ([#1818](https://github.com/duyet/clickhouse-monitoring/issues/1818)) ([3547aa1](https://github.com/duyet/clickhouse-monitoring/commit/3547aa184ab3beeacd29ca9c494ec4fbbc106309))
* **charts:** use REFRESH_INTERVAL constant in data-freshness ([#1799](https://github.com/duyet/clickhouse-monitoring/issues/1799)) ([#1801](https://github.com/duyet/clickhouse-monitoring/issues/1801)) ([359c450](https://github.com/duyet/clickhouse-monitoring/commit/359c450b57324c1d616a8157b71bb634ce051b03))
* **clickhouse-client:** remove dead query() helper (Workers trap) ([#1789](https://github.com/duyet/clickhouse-monitoring/issues/1789)) ([bb02046](https://github.com/duyet/clickhouse-monitoring/commit/bb0204604f0135e474cbe17b5c09df66a03854aa))
* dedup formatDuration + tighten data-table types (review-ready, supersedes [#1823](https://github.com/duyet/clickhouse-monitoring/issues/1823)) ([#1825](https://github.com/duyet/clickhouse-monitoring/issues/1825)) ([5f14b25](https://github.com/duyet/clickhouse-monitoring/commit/5f14b254e1283779ec57885b359b4c261eabedf5))
* **docs:** replace custom theme with native Astro Starlight ([#1757](https://github.com/duyet/clickhouse-monitoring/issues/1757)) ([32b2841](https://github.com/duyet/clickhouse-monitoring/commit/32b28418f48d4fd871f3ff34a1ad0e59bed30ebe))
* **insights:** redesign insight card with tinted icon box ([978e011](https://github.com/duyet/clickhouse-monitoring/commit/978e0114a7b722b3f5c2aae78ab108bbc544b866))
* remove deprecated variants property from QueryConfig type schema ([#1765](https://github.com/duyet/clickhouse-monitoring/issues/1765)) ([14a5ff4](https://github.com/duyet/clickhouse-monitoring/commit/14a5ff4d8d015b06fbe3debdf409b614b66e6634))

## [0.2.10](https://github.com/duyet/clickhouse-monitoring/compare/v0.2.9...v0.2.10) (2026-06-18)


### ✨ Features

* **agent:** add AgentState as a conversation-history backend option ([#1673](https://github.com/duyet/clickhouse-monitoring/issues/1673)) ([9080602](https://github.com/duyet/clickhouse-monitoring/commit/90806029d694550188690c022694df550a196b2f))
* **agent:** add scatter/radial/bar-list chart types to chat visualization ([#1658](https://github.com/duyet/clickhouse-monitoring/issues/1658)) ([a9b8a3f](https://github.com/duyet/clickhouse-monitoring/commit/a9b8a3f4e190e5b647fd25865a9d06cc5de7c8f6))
* **agent:** expand skill library with 9 new skills ([#1655](https://github.com/duyet/clickhouse-monitoring/issues/1655)) ([3accc86](https://github.com/duyet/clickhouse-monitoring/commit/3accc861121f0a3e9ed5749e0b952588e36efc74))
* **agent:** route AnyRouter upstream through @anyr/ai-sdk-provider ([#1682](https://github.com/duyet/clickhouse-monitoring/issues/1682)) ([eec305e](https://github.com/duyet/clickhouse-monitoring/commit/eec305e5cdad133dbcba1941732128a5d22151fc))
* **agent:** route prod conversations to AgentState backend ([#1731](https://github.com/duyet/clickhouse-monitoring/issues/1731)) ([cf15bbb](https://github.com/duyet/clickhouse-monitoring/commit/cf15bbb9286bc62d9db284cc671347abffd64ba8))
* **auth:** add SSO/SAML scaffold (enterprise-gated, community inert) ([#1700](https://github.com/duyet/clickhouse-monitoring/issues/1700)) ([c948e3f](https://github.com/duyet/clickhouse-monitoring/commit/c948e3f0e6248ea693a68449ed8de45d745c6ff0))
* **brand:** flatten chmonitor mark across landing, docs & dashboard ([#1661](https://github.com/duyet/clickhouse-monitoring/issues/1661)) ([5277eec](https://github.com/duyet/clickhouse-monitoring/commit/5277eec480bd4937f4f143925a74bfdbcdf0b933))
* **brand:** use chmonitor mark in host switcher ([#1662](https://github.com/duyet/clickhouse-monitoring/issues/1662)) ([7873e44](https://github.com/duyet/clickhouse-monitoring/commit/7873e44617716e32823f0c1eceb2c6dfa9204798))
* **ch-capabilities:** add capability-diff report formatter (Plan 10c offline) ([#1724](https://github.com/duyet/clickhouse-monitoring/issues/1724)) ([ff6f7da](https://github.com/duyet/clickhouse-monitoring/commit/ff6f7da2d9ddb5bf5ceb1a0dc498ffffd6c2a480))
* **ch-compat:** add capability discovery + diff harness ([#1703](https://github.com/duyet/clickhouse-monitoring/issues/1703)) ([e7b279d](https://github.com/duyet/clickhouse-monitoring/commit/e7b279d17ee44075230e964f22fbdb52c725e431))
* **charts:** redesign query activity heatmap as github-style year calendar ([5f9f137](https://github.com/duyet/clickhouse-monitoring/commit/5f9f137f2b247383a376483da46600eeeec43113))
* **ci:** add Claude Code GitHub Workflow ([#1664](https://github.com/duyet/clickhouse-monitoring/issues/1664)) ([08f4ea4](https://github.com/duyet/clickhouse-monitoring/commit/08f4ea435bb85af28e7defa3733cc6c8649c1bf8))
* **deploy:** add Railway/Render/Fly one-click templates ([#1708](https://github.com/duyet/clickhouse-monitoring/issues/1708)) ([e61d41c](https://github.com/duyet/clickhouse-monitoring/commit/e61d41c7c7b6b05c604e929c17c9ad16dec754c5))
* **docs:** generate ClickHouse platform support matrix ([#1702](https://github.com/duyet/clickhouse-monitoring/issues/1702)) ([a7d1deb](https://github.com/duyet/clickhouse-monitoring/commit/a7d1deb682e09774488f2a1893189a975861b19a))
* **docs:** redirect /docs to docs.chmonitor.dev, remove in-app reader ([#1663](https://github.com/duyet/clickhouse-monitoring/issues/1663)) ([6eea45b](https://github.com/duyet/clickhouse-monitoring/commit/6eea45b8676be1cef1bc13d873fad651c3de5fe3))
* **edition:** add open-core edition module (default community, fail-open) ([#1690](https://github.com/duyet/clickhouse-monitoring/issues/1690)) ([cc78c22](https://github.com/duyet/clickhouse-monitoring/commit/cc78c22f82b351584ff3a1eca08d09bda8e062df))
* **health:** redesign Health Summary with severity banner, filters & sparklines ([#1680](https://github.com/duyet/clickhouse-monitoring/issues/1680)) ([24d6765](https://github.com/duyet/clickhouse-monitoring/commit/24d6765a4a81d16de886a333efee2bf16c8a6ec5))
* **helm:** publish chart to OCI and GitHub Pages on release ([8636352](https://github.com/duyet/clickhouse-monitoring/commit/8636352952ac2548b74edc8c89e6fa6099c74c49))
* **helm:** serve chart repo via Cloudflare Pages at charts.chmonitor.dev ([#1747](https://github.com/duyet/clickhouse-monitoring/issues/1747)) ([a5c5d1e](https://github.com/duyet/clickhouse-monitoring/commit/a5c5d1e38999124f7ee00d9acf84c583fafce791))
* **landing:** add chmonitor logo system + /brand page ([#1660](https://github.com/duyet/clickhouse-monitoring/issues/1660)) ([77d15d3](https://github.com/duyet/clickhouse-monitoring/commit/77d15d3106fd11fb49aa199b6b6bfba7c2f0c1d3))
* **menu:** surface 5 orphaned pages in navigation ([#1735](https://github.com/duyet/clickhouse-monitoring/issues/1735)) ([762d915](https://github.com/duyet/clickhouse-monitoring/commit/762d9155c2df1243ec3b8f71b741843f0b6b02c7))
* **overview:** add multi-disk Disk Usage breakdown card ([#1674](https://github.com/duyet/clickhouse-monitoring/issues/1674)) ([f1fafa1](https://github.com/duyet/clickhouse-monitoring/commit/f1fafa122c93bf92e20ef102b1f64bd961e5d33b))
* **overview:** break Query Activity Heatmap into compact per-month blocks ([#1725](https://github.com/duyet/clickhouse-monitoring/issues/1725)) ([d491024](https://github.com/duyet/clickhouse-monitoring/commit/d49102433e99c4811eb233fe3629bea6a0bfcee6))
* **overview:** icons on heatmap metric pills, compact KPI cards, hidden scrollbar ([#1727](https://github.com/duyet/clickhouse-monitoring/issues/1727)) ([93eae72](https://github.com/duyet/clickhouse-monitoring/commit/93eae72bf0a10e4d598d67b889cb370430c518c7))
* **overview:** move query activity heatmap to top, full width ([#1668](https://github.com/duyet/clickhouse-monitoring/issues/1668)) ([d6d4876](https://github.com/duyet/clickhouse-monitoring/commit/d6d4876c11a8dd7b8deb194944a379cae688268f))
* **overview:** redesign Query Activity Heatmap as multi-metric full-width banner ([#1681](https://github.com/duyet/clickhouse-monitoring/issues/1681)) ([0dc0a36](https://github.com/duyet/clickhouse-monitoring/commit/0dc0a364064376caa2e885f482826d2105d991c3))
* **overview:** restyle backup size card empty state ([#1677](https://github.com/duyet/clickhouse-monitoring/issues/1677)) ([fea30f7](https://github.com/duyet/clickhouse-monitoring/commit/fea30f72815998c3f82d0a6d81d8658c4f687c97))
* **overview:** restyle disk size card to match storage redesign ([#1675](https://github.com/duyet/clickhouse-monitoring/issues/1675)) ([a30082c](https://github.com/duyet/clickhouse-monitoring/commit/a30082c00958200e6dff2bc2188edb9700d2bda0))
* **overview:** restyle storage tab — partition health stat-triad, RankBars, grid ([#1678](https://github.com/duyet/clickhouse-monitoring/issues/1678)) ([b48dfb6](https://github.com/duyet/clickhouse-monitoring/commit/b48dfb68c13c519396d3e8f2de423db5b914bd8d))
* **query-config:** add clickhouseSettings to declarative schema; migrate tables-overview + stack-traces ([#1717](https://github.com/duyet/clickhouse-monitoring/issues/1717)) ([c940031](https://github.com/duyet/clickhouse-monitoring/commit/c940031d4c1436a93ee6657236b879b926c4a6a7))
* **query-config:** add declarative config loader behind CHM_CONFIG_SOURCE (default ts) ([#1689](https://github.com/duyet/clickhouse-monitoring/issues/1689)) ([43c1d31](https://github.com/duyet/clickhouse-monitoring/commit/43c1d31377d6f80663d2a0c6adae1b190a569a75))
* **query-config:** add declarative config schema + validator ([#1685](https://github.com/duyet/clickhouse-monitoring/issues/1685)) ([91f3837](https://github.com/duyet/clickhouse-monitoring/commit/91f3837aeb5ffc016af639e8772ee1069a293758))
* **query-config:** declarative docs as plain string + migrate query-cache/merge-performance ([#1718](https://github.com/duyet/clickhouse-monitoring/issues/1718)) ([c875dc7](https://github.com/duyet/clickhouse-monitoring/commit/c875dc7b01527a139cab9d52908361541136edfe))
* **query-config:** declarative expandable spec, migrate settings/users ([#1728](https://github.com/duyet/clickhouse-monitoring/issues/1728)) ([d119b03](https://github.com/duyet/clickhouse-monitoring/commit/d119b036aab479b73860fa565ad195bd8bfc627e))
* **query-config:** declarative permission field + migrate query-detail/mergetree-settings/metrics ([#1721](https://github.com/duyet/clickhouse-monitoring/issues/1721)) ([640ea18](https://github.com/duyet/clickhouse-monitoring/commit/640ea18748f2b171372a23c598b33c62c4a6e786))
* **query-config:** declarative rowStyle (compiles to rowClassName) + migrate kafka-consumers ([#1719](https://github.com/duyet/clickhouse-monitoring/issues/1719)) ([e3d82e5](https://github.com/duyet/clickhouse-monitoring/commit/e3d82e5e67f2a8ececbddd4e1aa51689df7034d2))
* **query-config:** migrate explorer/ domain to declarative catalog (behind flag) ([#1693](https://github.com/duyet/clickhouse-monitoring/issues/1693)) ([63595e5](https://github.com/duyet/clickhouse-monitoring/commit/63595e5598dca73b1b1fb73a6d5be827820c31cf))
* **query-config:** migrate keeper/ domain to declarative catalog (behind flag) ([#1694](https://github.com/duyet/clickhouse-monitoring/issues/1694)) ([2e555d0](https://github.com/duyet/clickhouse-monitoring/commit/2e555d02db6c65e077373bb250ad52813d4c8a4e))
* **query-config:** migrate logs/security/anomaly/merges domains to declarative (behind flag) ([#1697](https://github.com/duyet/clickhouse-monitoring/issues/1697)) ([dbe6de1](https://github.com/duyet/clickhouse-monitoring/commit/dbe6de146e46fa71da726d500289c1541cd6629a))
* **query-config:** migrate more/ domain to declarative catalog (behind flag) ([#1695](https://github.com/duyet/clickhouse-monitoring/issues/1695)) ([3d86388](https://github.com/duyet/clickhouse-monitoring/commit/3d8638887f6caccc3ff05b03ab15371f63bcd8c4))
* **query-config:** migrate part-info/projections/user-processes to declarative catalog ([#1716](https://github.com/duyet/clickhouse-monitoring/issues/1716)) ([a6c133e](https://github.com/duyet/clickhouse-monitoring/commit/a6c133ebb1568ba44580466f33b8b1b5a2cf47a0))
* **query-config:** migrate part-log + mutations to declarative rowStyle ([#1720](https://github.com/duyet/clickhouse-monitoring/issues/1720)) ([26dd40c](https://github.com/duyet/clickhouse-monitoring/commit/26dd40caa26b42a8b7e25ce4d001229502da4839))
* **query-config:** migrate queries/ domain to declarative (behind flag) ([#1696](https://github.com/duyet/clickhouse-monitoring/issues/1696)) ([2996fca](https://github.com/duyet/clickhouse-monitoring/commit/2996fcada4b4f92b7b43c6db36d0521267996baf))
* **query-config:** migrate system/ domain to declarative catalog (behind flag) ([#1691](https://github.com/duyet/clickhouse-monitoring/issues/1691)) ([4507be8](https://github.com/duyet/clickhouse-monitoring/commit/4507be83e825197810cdff1bdcffea5cb613c1f1))
* **query-config:** migrate tables/ domain to declarative catalog (behind flag) ([#1692](https://github.com/duyet/clickhouse-monitoring/issues/1692)) ([ba5ea86](https://github.com/duyet/clickhouse-monitoring/commit/ba5ea86fc5d61aace081559fc8bd44b4e25f6076))
* **query-config:** resolve declarative catalog in registry behind CHM_CONFIG_SOURCE (default ts) ([#1699](https://github.com/duyet/clickhouse-monitoring/issues/1699)) ([9a545ae](https://github.com/duyet/clickhouse-monitoring/commit/9a545ae8bfef58ab13b2642006f97e7f8ef51c95))
* **rbac:** add RBAC scaffold (community all-access, fail-open) ([#1698](https://github.com/duyet/clickhouse-monitoring/issues/1698)) ([1d54595](https://github.com/duyet/clickhouse-monitoring/commit/1d545951c9da47407f022656e1732fb1e7f6e4cb))
* **telemetry:** add opt-in daily instance ping (dark by default) ([#1688](https://github.com/duyet/clickhouse-monitoring/issues/1688)) ([964f6b3](https://github.com/duyet/clickhouse-monitoring/commit/964f6b39498e0317d63f27253844bf73d7a8d8f5))
* **telemetry:** add opt-in telemetry core (off by default) ([#1683](https://github.com/duyet/clickhouse-monitoring/issues/1683)) ([87b6de0](https://github.com/duyet/clickhouse-monitoring/commit/87b6de0b0f372608ff12e7ca050adc66aa3c40cc))
* **telemetry:** capture deploy target + ClickHouse version/flavor dimensions ([#1686](https://github.com/duyet/clickhouse-monitoring/issues/1686)) ([6ac19ce](https://github.com/duyet/clickhouse-monitoring/commit/6ac19cec828ae0214bd3f33f8bc6f59efbdb5a86))
* **telemetry:** wire activation events + define activation metric ([#1684](https://github.com/duyet/clickhouse-monitoring/issues/1684)) ([9a3137e](https://github.com/duyet/clickhouse-monitoring/commit/9a3137e1cc318db9d3eaf8b52202fd30139285af))


### 🐛 Bug Fixes

* **agent:** separate reasoning & tool blocks, local grouping, auto-collapse ([#1657](https://github.com/duyet/clickhouse-monitoring/issues/1657)) ([e20b996](https://github.com/duyet/clickhouse-monitoring/commit/e20b99648eaa023d3b867a162adb39b6b898fca2))
* **charts:** degrade optional chart with missing table to empty 200 ([#1733](https://github.com/duyet/clickhouse-monitoring/issues/1733)) ([ef5161c](https://github.com/duyet/clickhouse-monitoring/commit/ef5161c31b9910c9e64c0f7743c4675403d3c7f8))
* **charts:** mount charts eagerly to stop scroll-triggered skeleton flashing ([dd398dc](https://github.com/duyet/clickhouse-monitoring/commit/dd398dc4f1cec13a72b2b5b5ca386cb14846eab9))
* **charts:** stop disks-usage query OOM by pre-filtering metrics ([#1736](https://github.com/duyet/clickhouse-monitoring/issues/1736)) ([8c2e920](https://github.com/duyet/clickhouse-monitoring/commit/8c2e9201047f9ee6bc2761bbdceb50791c8a5c14))
* **ci:** publish chmonitor multi-arch manifest on push to main ([#1751](https://github.com/duyet/clickhouse-monitoring/issues/1751)) ([36ffe49](https://github.com/duyet/clickhouse-monitoring/commit/36ffe499cf1156cfbaa4f33d5df40517af098bea))
* **conversation-store:** widen AgentState list scan to keep older history ([#1737](https://github.com/duyet/clickhouse-monitoring/issues/1737)) ([69ec855](https://github.com/duyet/clickhouse-monitoring/commit/69ec855f06ae131836ee473a179678a757aa5b00))
* **dashboard:** responsive audit — min-w-0 on about FeatureCard ([#1666](https://github.com/duyet/clickhouse-monitoring/issues/1666)) ([65fc2e6](https://github.com/duyet/clickhouse-monitoring/commit/65fc2e66d851ab4e34ad8d71256281d63b44c69c))
* **data-table:** contain horizontal scroll within table on mobile ([#1670](https://github.com/duyet/clickhouse-monitoring/issues/1670)) ([e58ca6e](https://github.com/duyet/clickhouse-monitoring/commit/e58ca6e6759036c705b8f0786234472f848d6324))
* **healthz:** add /healthz route and fix k8s probe crash loop ([e3886b6](https://github.com/duyet/clickhouse-monitoring/commit/e3886b63b44ec09206ed8464c6d0493f51335073))
* **healthz:** add /heathz typo alias sharing the same handler ([47cbed4](https://github.com/duyet/clickhouse-monitoring/commit/47cbed460e809433c163349fa116756aa75e92ea))
* **healthz:** bound /api/healthz ping + parameterize chart probes + dual-runtime guard ([#1749](https://github.com/duyet/clickhouse-monitoring/issues/1749)) ([67b49c8](https://github.com/duyet/clickhouse-monitoring/commit/67b49c898d2f394cc0cbc06d82deea08dd7a2624))
* **helm:** bootstrap gh-pages branch on first chart release ([#1745](https://github.com/duyet/clickhouse-monitoring/issues/1745)) ([b676241](https://github.com/duyet/clickhouse-monitoring/commit/b676241453d57ad9304539b4376a3d3c96599803))
* **helm:** drop dead Pages-enable step that 403s every run ([#1746](https://github.com/duyet/clickhouse-monitoring/issues/1746)) ([c4ff1d6](https://github.com/duyet/clickhouse-monitoring/commit/c4ff1d6bb6b87802441fc3a80f85a0c0a309c796))
* **helm:** skip existing releases so chart-releaser is idempotent ([#1748](https://github.com/duyet/clickhouse-monitoring/issues/1748)) ([b05072c](https://github.com/duyet/clickhouse-monitoring/commit/b05072c3f5899f27549720e2553f9a7480ad3fa7))
* **insights:** add auto-rows to charts grid to prevent blank space ([#1671](https://github.com/duyet/clickhouse-monitoring/issues/1671)) ([047648a](https://github.com/duyet/clickhouse-monitoring/commit/047648a603a373094e8bd2a681b01a2943b38a94))
* **insights:** align card title padding between skeleton and loaded states ([#1667](https://github.com/duyet/clickhouse-monitoring/issues/1667)) ([35c8a3c](https://github.com/duyet/clickhouse-monitoring/commit/35c8a3cf01d69c457c83f25cb941a4acbc51679f))
* **insights:** give charts-section grid definite row height ([7e70f1d](https://github.com/duyet/clickhouse-monitoring/commit/7e70f1dc4123724fba37a00b9b471fdb6c4b1834))
* **landing:** correct stale OpenNext deploy copy on the marketing page ([#1714](https://github.com/duyet/clickhouse-monitoring/issues/1714)) ([5ba0eb9](https://github.com/duyet/clickhouse-monitoring/commit/5ba0eb93b14063fb42b05a8db07bf5f16ac16206))
* **overview:** remove stray tab strip scrollbar ([#1665](https://github.com/duyet/clickhouse-monitoring/issues/1665)) ([b4e8d7c](https://github.com/duyet/clickhouse-monitoring/commit/b4e8d7cf673b587f0d47375d77566d319dce19e8))
* **shell:** resolve app-shell Lighthouse a11y failures (aria, label, skip-link) ([#1734](https://github.com/duyet/clickhouse-monitoring/issues/1734)) ([200cdc7](https://github.com/duyet/clickhouse-monitoring/commit/200cdc74f127d19b987e1fa8017a91fa602cd7db))
* **ui:** explorer tree a11y — name toggle buttons, fix list nesting ([#1740](https://github.com/duyet/clickhouse-monitoring/issues/1740)) ([f09751d](https://github.com/duyet/clickhouse-monitoring/commit/f09751d47ca4cb4ab8db878b185fccab5c75d7b2))
* **ui:** give data-table Select triggers accessible names ([#1741](https://github.com/duyet/clickhouse-monitoring/issues/1741)) ([405e9bf](https://github.com/duyet/clickhouse-monitoring/commit/405e9bf67b522ec090e8721f666b0ba376653470))
* **ui:** give Progress bars accessible names (aria-progressbar-name) ([#1743](https://github.com/duyet/clickhouse-monitoring/issues/1743)) ([bfe4e1e](https://github.com/duyet/clickhouse-monitoring/commit/bfe4e1e50c09e923a933a74be7f178442f448901))
* **ui:** host switcher accessible name matches visible label (WCAG 2.5.3) ([#1742](https://github.com/duyet/clickhouse-monitoring/issues/1742)) ([ea9ae2f](https://github.com/duyet/clickhouse-monitoring/commit/ea9ae2f6785806acdac24bd9c9cf50d299ec8827))
* **ui:** name the icon-only query-row action links (a11y link-name) ([#1739](https://github.com/duyet/clickhouse-monitoring/issues/1739)) ([786f2e0](https://github.com/duyet/clickhouse-monitoring/commit/786f2e0f87c05736fbbc41831e06a519f226b934))
* **ui:** raise contrast of data-table "N records" count (WCAG AA) ([#1744](https://github.com/duyet/clickhouse-monitoring/issues/1744)) ([492ca08](https://github.com/duyet/clickhouse-monitoring/commit/492ca08454a07ebc70959ad1bf914cc4a855f0aa))
* **ui:** raise contrast on muted labels and the "New" badge (WCAG AA) ([#1738](https://github.com/duyet/clickhouse-monitoring/issues/1738)) ([8f64428](https://github.com/duyet/clickhouse-monitoring/commit/8f64428ae82c02e72cb88843806b17462fd7893f))


### ⚡ Performance

* **health:** batch health checks into one request + show cached values instantly ([#1669](https://github.com/duyet/clickhouse-monitoring/issues/1669)) ([9be95d8](https://github.com/duyet/clickhouse-monitoring/commit/9be95d8fa8dd915ba2e01bbe30ce20358fac325c))


### ♻️ Refactoring

* **agent:** trim tools to lean primitives (63 to ~18) ([#1656](https://github.com/duyet/clickhouse-monitoring/issues/1656)) ([6879bf1](https://github.com/duyet/clickhouse-monitoring/commit/6879bf145063356446c55921b6788bf9d860ab27))

## [0.2.9](https://github.com/duyet/clickhouse-monitoring/compare/v0.2.8...v0.2.9) (2026-06-14)


### 🐛 Bug Fixes

* **ci:** align release docker cache scope + diagnosable container health checks ([#1610](https://github.com/duyet/clickhouse-monitoring/issues/1610)) ([ae78ad9](https://github.com/duyet/clickhouse-monitoring/commit/ae78ad918667dda2f51a2a8347f2402c039c3798))
* **ci:** pass -R to gh workflow run in release-please ([#1608](https://github.com/duyet/clickhouse-monitoring/issues/1608)) ([da18863](https://github.com/duyet/clickhouse-monitoring/commit/da18863b3132467cbd69fb8ab8450c5478ffb258))

## [0.2.8](https://github.com/duyet/clickhouse-monitoring/compare/v0.2.7...v0.2.8) (2026-06-13)


### ✨ Features

* **release:** tiered LLM notes (Copilot→Models→AnyRouter), recap stats, docker pin ([#1582](https://github.com/duyet/clickhouse-monitoring/issues/1582)) ([3009f99](https://github.com/duyet/clickhouse-monitoring/commit/3009f994a9c73f3a018ddae6f148a7a8bce9103b))


### 🐛 Bug Fixes

* add Running Queries and Clusters as top-level sidebar items ([#1569](https://github.com/duyet/clickhouse-monitoring/issues/1569)) ([74fc5eb](https://github.com/duyet/clickhouse-monitoring/commit/74fc5eb6f2dae1a7bfe931cac07d0d57470c7bde))
* **api:** enforce auth on clean/init/pageview endpoints and sanitize error responses ([#1602](https://github.com/duyet/clickhouse-monitoring/issues/1602)) ([9b9d239](https://github.com/duyet/clickhouse-monitoring/commit/9b9d2398bba240573de50977a83be313e2ba0f99))
* **clickhouse-client:** harden http status code regex in clickhouse-fetch ([#1578](https://github.com/duyet/clickhouse-monitoring/issues/1578)) ([0d27e33](https://github.com/duyet/clickhouse-monitoring/commit/0d27e33811e223c4d5a3e569e3dd1a95f8218530))
* **clickhouse-client:** redact inline credentials from host config debug logs ([#1581](https://github.com/duyet/clickhouse-monitoring/issues/1581)) ([6d0609b](https://github.com/duyet/clickhouse-monitoring/commit/6d0609b5a3cbf442730ed2cd2880200810e3ee78))
* **dashboard-tsr:** bridge CLICKHOUSE_DATABASE and EVENTS_TABLE_NAME on workers ([#1576](https://github.com/duyet/clickhouse-monitoring/issues/1576)) ([8096672](https://github.com/duyet/clickhouse-monitoring/commit/80966727cf779cd2731b375261d7eb0e3e85adef))
* **dashboard-tsr:** fix a11y violations in health, dashboard, and menu ([#1588](https://github.com/duyet/clickhouse-monitoring/issues/1588)) ([5340ce8](https://github.com/duyet/clickhouse-monitoring/commit/5340ce8b477510c51c28737b1c5123dd73dc70e1))
* **dashboard-tsr:** listen for swr:revalidate event to refresh TanStack Query cache ([#1579](https://github.com/duyet/clickhouse-monitoring/issues/1579)) ([7927f18](https://github.com/duyet/clickhouse-monitoring/commit/7927f18fd6dd831861bb2757c477ff06fb0084c6))
* **dashboard-tsr:** skip hash-anchor URLs in prerender crawl to unblock Docker build ([#1583](https://github.com/duyet/clickhouse-monitoring/issues/1583)) ([f001263](https://github.com/duyet/clickhouse-monitoring/commit/f001263953dbb4c459b4b84de6b2bec1d6273494))
* **dashboard-tsr:** type menu-counts test to unblock type-check:test ([#1605](https://github.com/duyet/clickhouse-monitoring/issues/1605)) ([850162e](https://github.com/duyet/clickhouse-monitoring/commit/850162e2fe6d56f62731c7adef787ea2bfb39449))
* **e2e:** expand collapsible menu sections before checking sidebar links ([#1568](https://github.com/duyet/clickhouse-monitoring/issues/1568)) ([cc6cdbd](https://github.com/duyet/clickhouse-monitoring/commit/cc6cdbd33ea75a7abfedde6659e2a3a5ea23f340))
* **logger:** safely guard process.env access for browser and serverless runtimes ([#1589](https://github.com/duyet/clickhouse-monitoring/issues/1589)) ([36f3b1d](https://github.com/duyet/clickhouse-monitoring/commit/36f3b1d357e138fecb7b342636f7828eeded8da5))
* **rust/ch-json:** prevent normalization of numeric strings with leading zeros ([#1590](https://github.com/duyet/clickhouse-monitoring/issues/1590)) ([eb9a091](https://github.com/duyet/clickhouse-monitoring/commit/eb9a091d9ba39dc3204083458caaee84af94a88e))
* **validate-docker:** bundle @clickhouse/client-common + follow root redirect ([#1604](https://github.com/duyet/clickhouse-monitoring/issues/1604)) ([6d280d9](https://github.com/duyet/clickhouse-monitoring/commit/6d280d9d74cc0d56d5779b754c502e6b113965ef))


### ⚡ Performance

* **dashboard-tsr:** optimize menu counts endpoint to use single batched query ([#1591](https://github.com/duyet/clickhouse-monitoring/issues/1591)) ([dff6ed4](https://github.com/duyet/clickhouse-monitoring/commit/dff6ed4b531424f969bff5181ad7aa68f2a7715a))
* **dashboard-tsr:** unmount collapsed chart rows to stop background polling ([#1580](https://github.com/duyet/clickhouse-monitoring/issues/1580)) ([1400632](https://github.com/duyet/clickhouse-monitoring/commit/14006320758aef09b3485b5d99d4d9dabbda2e3b))

## [Unreleased] — v0.3 preview

> **v0.3 rebuilds the dashboard on TanStack Start.** Full upgrade steps:
> [Migrate to v0.3](docs/content/migrating/v0-3.mdx) ·
> What's new: [Release notes](docs/content/releases/v0-3.mdx).

### 💥 Breaking Changes

- **Runtime app switched from Next.js to TanStack Start** (`apps/dashboard-tsr`
  replaces `apps/dashboard` as the primary app). Same features, routes, and
  ClickHouse setup.
- **Browser env vars renamed `NEXT_PUBLIC_*` → `VITE_*`** (build-time inlined).
  The old `NEXT_PUBLIC_*` names still work as a compatibility fallback, so the
  rename is recommended but not required.
- **Docker entrypoint changed** from `node server.js` (OpenNext standalone) to
  `node server/index.mjs` (Nitro node-server). Port `3000` and the
  `/api/healthz` healthcheck are unchanged.

### 🔧 Environment Changes

| Old (v0.2) | New (v0.3) | Notes |
|---|---|---|
| `NEXT_PUBLIC_AUTH_PROVIDER` | `VITE_AUTH_PROVIDER` | client; server uses `CHM_AUTH_PROVIDER` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `VITE_CLERK_PUBLISHABLE_KEY` | client, build-time |
| `NEXT_PUBLIC_FEATURE_CONVERSATION_DB` | `VITE_FEATURE_CONVERSATION_DB` | client, build-time |
| `NEXT_PUBLIC_AUTOCOMPLETE_LIMIT` | `VITE_AUTOCOMPLETE_LIMIT` | client, build-time |
| `NEXT_PUBLIC_RUNNING_QUERIES_REFRESH_MS` | `VITE_RUNNING_QUERIES_REFRESH_MS` | client, build-time |
| `CLICKHOUSE_*`, `CHM_*`, `CLERK_SECRET_KEY`, `*_API_KEY` | _unchanged_ | server vars |

New optional vars: `CHM_AUTH_PROVIDER` (`none\|clerk\|proxy`), `CHM_API_KEY_SECRET`,
`CHM_CF_ACCESS_TEAM_DOMAIN` + `CHM_CF_ACCESS_AUD`, `CHM_PROXY_AUTH_SECRET`,
`HEALTH_ALERT_ENABLED` + `HEALTH_ALERT_WEBHOOK_URL`,
`AGENT_CONVERSATION_PERSISTENCE` + `AGENT_CONVERSATION_STORE`.

### ✨ Features

- **Promote TanStack Start dashboard to primary, remove legacy Next.js app** ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)).

### 🤖 Migrate with an AI assistant

Paste your config into any AI assistant with the prompt in
[`.github/release-migration-prompt.md`](.github/release-migration-prompt.md)
(also published in every breaking-change GitHub Release and in the
[README](README.md#upgrading-to-v03)).

## [0.2.7](https://github.com/duyet/clickhouse-monitoring/compare/v0.2.6...v0.2.7) (2026-06-13)


### ✨ Features

* add perf-compare script for Win Metrics ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([#1514](https://github.com/duyet/clickhouse-monitoring/issues/1514)) ([faa6972](https://github.com/duyet/clickhouse-monitoring/commit/faa697231f10a44d280ea8188046855a597e9f89))
* **agent:** add conversation storage adapters ([#1517](https://github.com/duyet/clickhouse-monitoring/issues/1517)) ([34ac9d4](https://github.com/duyet/clickhouse-monitoring/commit/34ac9d4b847124c19d31ccae9eea90a56ec469f4))
* **auth:** activate CHM_CLERK_PUBLIC_READ on dash + dash-tsr ([#1536](https://github.com/duyet/clickhouse-monitoring/issues/1536)) ([e9b7e45](https://github.com/duyet/clickhouse-monitoring/commit/e9b7e45d46cce5ce796e23f71d2e9f3d3e4befcd))
* **auth:** read/write permission model + CHM_CLERK_PUBLIC_READ ([#1535](https://github.com/duyet/clickhouse-monitoring/issues/1535)) ([1112238](https://github.com/duyet/clickhouse-monitoring/commit/1112238714d3d3d24ec01757e089c10c3752e477))
* **dashboard-tsr:** BI-style SQL Console + fix explorer tab-switch freeze ([#1531](https://github.com/duyet/clickhouse-monitoring/issues/1531)) ([b42ebb9](https://github.com/duyet/clickhouse-monitoring/commit/b42ebb9be1af587008e531436c941eae9a4e026e))
* **dashboard-tsr:** pluggable auth providers (none|clerk|proxy) + CF Access/proxy + auth docs + v0.3 changelog ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([#1440](https://github.com/duyet/clickhouse-monitoring/issues/1440)) ([4c2a50c](https://github.com/duyet/clickhouse-monitoring/commit/4c2a50c3b6ed892dce862338b753a5eab3e68772))
* **docs:** astro-design-system theme + per-release versioning ([#1529](https://github.com/duyet/clickhouse-monitoring/issues/1529)) ([2552de4](https://github.com/duyet/clickhouse-monitoring/commit/2552de4365481cabd796526ed1e8d1d42b7ca78a))


### 🐛 Bug Fixes

* add missing WASM artifact upload step in CI workflow ([#1553](https://github.com/duyet/clickhouse-monitoring/issues/1553)) ([13fcd92](https://github.com/duyet/clickhouse-monitoring/commit/13fcd928eb426b1bf520317d5a685e01db03f809))
* **agent:** send AnyRouter category in X-AnyRouter-Categories, not the source header ([#1516](https://github.com/duyet/clickhouse-monitoring/issues/1516)) ([20cb0a3](https://github.com/duyet/clickhouse-monitoring/commit/20cb0a39a5d2493ddca163b15e7a5612af7561ea))
* change regex to /\bunion\s+(all\s+)?select\b/i. ([0f15879](https://github.com/duyet/clickhouse-monitoring/commit/0f15879e33cba3e9743041e9d8b626a8ec48083a))
* classify unknown table errors as table_not_found ([#1546](https://github.com/duyet/clickhouse-monitoring/issues/1546)) ([b0618af](https://github.com/duyet/clickhouse-monitoring/commit/b0618afc55dad189b35bea0122dd1abbf9f1400a))
* **dashboard-tsr:** accept Clerk session in /api/v1 guard ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([#1437](https://github.com/duyet/clickhouse-monitoring/issues/1437)) ([6b894e7](https://github.com/duyet/clickhouse-monitoring/commit/6b894e71a02839574e5e880cb4f0ea8f1faf1bbb))
* **dashboard-tsr:** add a11y attributes to KpiCard loading skeleton ([#1473](https://github.com/duyet/clickhouse-monitoring/issues/1473)) ([6ff8d63](https://github.com/duyet/clickhouse-monitoring/commit/6ff8d6370a1e6ca9f20e4b66101f640d3052e009))
* **dashboard-tsr:** add a11y loading announcement to LazyChartWrapper placeholder ([#1485](https://github.com/duyet/clickhouse-monitoring/issues/1485)) ([d4b56b9](https://github.com/duyet/clickhouse-monitoring/commit/d4b56b997cc10a835ffe5156a3b5aaa2c93f1fa6))
* **dashboard-tsr:** add focus-visible ring to explorer tree expand button ([#1458](https://github.com/duyet/clickhouse-monitoring/issues/1458)) ([88bfda7](https://github.com/duyet/clickhouse-monitoring/commit/88bfda75a2ff7416ddea1c4a44d7e6a297def59d))
* **dashboard-tsr:** add keyboard a11y to ChartEmpty clickable card ([#1478](https://github.com/duyet/clickhouse-monitoring/issues/1478)) ([1789061](https://github.com/duyet/clickhouse-monitoring/commit/17890619984ba0f91cf18d4c337e0d6c701f3fe4))
* **dashboard-tsr:** add keyboard a11y to explorer database cards ([#1481](https://github.com/duyet/clickhouse-monitoring/issues/1481)) ([0c91dc2](https://github.com/duyet/clickhouse-monitoring/commit/0c91dc2b8ef23e0155264f03649cbf7488e94424))
* **dashboard-tsr:** add security headers to static pages via _headers ([#1491](https://github.com/duyet/clickhouse-monitoring/issues/1491)) ([bc516dc](https://github.com/duyet/clickhouse-monitoring/commit/bc516dc876f34bf00678e1b3e52a16ee6841024f))
* **dashboard-tsr:** add security response headers ([#1487](https://github.com/duyet/clickhouse-monitoring/issues/1487)) ([0035c84](https://github.com/duyet/clickhouse-monitoring/commit/0035c8451491c7390264d04d076515edb65718c2))
* **dashboard-tsr:** add SheetTitle to ExplorerSidebar for screen-reader a11y ([#1457](https://github.com/duyet/clickhouse-monitoring/issues/1457)) ([bc9f76d](https://github.com/duyet/clickhouse-monitoring/commit/bc9f76d08cf74056788d162f43ef942a95d4fe40))
* **dashboard-tsr:** add SQL validation to browser-connections proxy endpoint ([#1471](https://github.com/duyet/clickhouse-monitoring/issues/1471)) ([cd9b309](https://github.com/duyet/clickhouse-monitoring/commit/cd9b309260aab9c3611ca9452ae83737101671dc))
* **dashboard-tsr:** add SQL validation to POST /api/v1/data with queryConfigName ([#1483](https://github.com/duyet/clickhouse-monitoring/issues/1483)) ([f54fa04](https://github.com/duyet/clickhouse-monitoring/commit/f54fa0418e5fcb66ba8773e04676d45405747354))
* **dashboard-tsr:** add underline variant to TabsSkeleton to prevent CLS on overview load ([#1460](https://github.com/duyet/clickhouse-monitoring/issues/1460)) ([7d17fe3](https://github.com/duyet/clickhouse-monitoring/commit/7d17fe38a846d0fd98b9aed510622fc85734d51c))
* **dashboard-tsr:** auth=none opens everything; frontend renders, backend enforces ([#1533](https://github.com/duyet/clickhouse-monitoring/issues/1533)) ([497d474](https://github.com/duyet/clickhouse-monitoring/commit/497d4745403f3bed64de5f9259021c854a425e43))
* **dashboard-tsr:** auto-reload on stale dynamic-import after deploy ([#1538](https://github.com/duyet/clickhouse-monitoring/issues/1538)) ([2ee1f31](https://github.com/duyet/clickhouse-monitoring/commit/2ee1f3146fd00ccc780ad7808fe25d6686b3c89f))
* **dashboard-tsr:** collapse root redirect to one edge hop + unblock e2e CI ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([763184e](https://github.com/duyet/clickhouse-monitoring/commit/763184e3923efca1bffcf570abefd9104ca970f7))
* **dashboard-tsr:** collapse root redirect to single edge hop + unblock e2e CI ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([2674450](https://github.com/duyet/clickhouse-monitoring/commit/2674450db5ad99ade9342908b73a7604bb02d36f))
* **dashboard-tsr:** convention fixes, stable keys, ai-agent docs sync, regression tests ([#1555](https://github.com/duyet/clickhouse-monitoring/issues/1555)) ([9c5944d](https://github.com/duyet/clickhouse-monitoring/commit/9c5944d30d58c4bead7b1772229d4f5845c6bbff))
* **dashboard-tsr:** correct explorer page height to account for shell padding ([#1479](https://github.com/duyet/clickhouse-monitoring/issues/1479)) ([2fd5802](https://github.com/duyet/clickhouse-monitoring/commit/2fd5802ee343b37ed44077c88a2f4f0a4fba7cb7))
* **dashboard-tsr:** deploy CHM_CLERK_PUBLIC_READ var (CI patch script) ([#1537](https://github.com/duyet/clickhouse-monitoring/issues/1537)) ([90d1378](https://github.com/duyet/clickhouse-monitoring/commit/90d13786d1b5a36995f31bf66625b3dc525a312d))
* **dashboard-tsr:** deterministic cache-bust in clerk-client test ([#1503](https://github.com/duyet/clickhouse-monitoring/issues/1503)) ([121184f](https://github.com/duyet/clickhouse-monitoring/commit/121184fc36005ff501184fff0100c79d44d11a31))
* **dashboard-tsr:** drop hardcoded clerk key default, sync env docs ([#1561](https://github.com/duyet/clickhouse-monitoring/issues/1561)) ([3bb9df9](https://github.com/duyet/clickhouse-monitoring/commit/3bb9df9148954f4cd2c3bc92efd412f6b5ad44cd))
* **dashboard-tsr:** enforce chart feature perms + port deprecated chart variants ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([#1445](https://github.com/duyet/clickhouse-monitoring/issues/1445)) ([07dc70c](https://github.com/duyet/clickhouse-monitoring/commit/07dc70c44cf963f3f4a1bc54ca5c520a90f0d2ab))
* **dashboard-tsr:** enforce ClickHouse readonly mode in /api/v1/data ([#1476](https://github.com/duyet/clickhouse-monitoring/issues/1476)) ([54f3af1](https://github.com/duyet/clickhouse-monitoring/commit/54f3af1cad64de6fc7ae9ebce28c9e5cb556b261))
* **dashboard-tsr:** keep agent menu visible when signed in ([#1453](https://github.com/duyet/clickhouse-monitoring/issues/1453)) ([5853abc](https://github.com/duyet/clickhouse-monitoring/commit/5853abca2a276b2c23fb3a7eb8e00a72f08b454a))
* **dashboard-tsr:** lint cleanup, flaky test, and query-config SQL fixes ([#1554](https://github.com/duyet/clickhouse-monitoring/issues/1554)) ([5ae1c49](https://github.com/duyet/clickhouse-monitoring/commit/5ae1c49656cef72b7cac0c54cd5cdb8f32fe3675))
* **dashboard-tsr:** make SSR stub constructable so prerender stops throwing ([#1499](https://github.com/duyet/clickhouse-monitoring/issues/1499)) ([a220610](https://github.com/duyet/clickhouse-monitoring/commit/a2206105cd3092dce29a0613f50e887c4e332dd6))
* **dashboard-tsr:** match overview fallback skeleton to KpiCard layout ([#1480](https://github.com/duyet/clickhouse-monitoring/issues/1480)) ([60af83d](https://github.com/duyet/clickhouse-monitoring/commit/60af83d87d7dad77a9675ee78ca2a197dd738430))
* **dashboard-tsr:** populate client chart-component registry (71 charts) ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([#1443](https://github.com/duyet/clickhouse-monitoring/issues/1443)) ([7fcf623](https://github.com/duyet/clickhouse-monitoring/commit/7fcf623ec7834c57d1fe430baa6820a994c16cfb))
* **dashboard-tsr:** query detail button + collapse charts instead of hiding ([#1497](https://github.com/duyet/clickhouse-monitoring/issues/1497)) ([15a43d5](https://github.com/duyet/clickhouse-monitoring/commit/15a43d56219e2205326e7e732ec680e851dbd7ef))
* **dashboard-tsr:** re-export shape-matched TableSkeleton to prevent CLS ([#1474](https://github.com/duyet/clickhouse-monitoring/issues/1474)) ([80a163b](https://github.com/duyet/clickhouse-monitoring/commit/80a163bdc07eb7f60433d5f5cb96ff29e3e8ba26))
* **dashboard-tsr:** register all chart modules so charts resolve ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([#1441](https://github.com/duyet/clickhouse-monitoring/issues/1441)) ([c42ed90](https://github.com/duyet/clickhouse-monitoring/commit/c42ed90385456f08ecb141deb2ba62ffa7a15a1f))
* **dashboard-tsr:** register clerkMiddleware + missing explorer configs ([#1496](https://github.com/duyet/clickhouse-monitoring/issues/1496)) ([6bf699e](https://github.com/duyet/clickhouse-monitoring/commit/6bf699e056004bfb64b37e7291ad4645e615433e))
* **dashboard-tsr:** remove aria-hidden that suppresses skeleton loading announcements ([#1482](https://github.com/duyet/clickhouse-monitoring/issues/1482)) ([a1d2af8](https://github.com/duyet/clickhouse-monitoring/commit/a1d2af8bfc16c6056e487a9d24c6aab71e6515b8))
* **dashboard-tsr:** replace require() Clerk gating with ESM imports ([#1532](https://github.com/duyet/clickhouse-monitoring/issues/1532)) ([764f8fb](https://github.com/duyet/clickhouse-monitoring/commit/764f8fb2211b04e585392918e62f718b4b97ce5b))
* **dashboard-tsr:** replace running-queries Suspense fallback with full-page skeleton ([#1467](https://github.com/duyet/clickhouse-monitoring/issues/1467)) ([f0c3a30](https://github.com/duyet/clickhouse-monitoring/commit/f0c3a3000e3b9266d8b31f52fd3c4317985e66ca))
* **dashboard-tsr:** restore focus-visible ring on overview tab triggers ([#1461](https://github.com/duyet/clickhouse-monitoring/issues/1461)) ([5a0639c](https://github.com/duyet/clickhouse-monitoring/commit/5a0639cd643e0c2944327e85eb917cc51f831d66))
* **dashboard-tsr:** shrink OverviewPageFallback status strip skeleton h-10→h-5 ([#1456](https://github.com/duyet/clickhouse-monitoring/issues/1456)) ([4781009](https://github.com/duyet/clickhouse-monitoring/commit/47810096794299ca5abfef54904ab5592103525b))
* **dashboard-tsr:** skip prerender for e2e build so the gate actually runs ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([cfa550c](https://github.com/duyet/clickhouse-monitoring/commit/cfa550cd86eeffc70ca1e80a250701ce3eef8dbf))
* **dashboard-tsr:** stabilize table/chart renders (memoize context + columns, keepPreviousData) ([#1543](https://github.com/duyet/clickhouse-monitoring/issues/1543)) ([c90b03c](https://github.com/duyet/clickhouse-monitoring/commit/c90b03c34f0aaf0b9904e8e67cc204f6d782799e))
* **dashboard-tsr:** stop full-page skeleton flash on overview tab switch ([#1454](https://github.com/duyet/clickhouse-monitoring/issues/1454)) ([02d5292](https://github.com/duyet/clickhouse-monitoring/commit/02d5292c53d6ebb8d12c69a0df935066f01458e7))
* **dashboard-tsr:** surface D1 persist failures + bound repoCache + guard conversation routes ([#1511](https://github.com/duyet/clickhouse-monitoring/issues/1511)) ([305341b](https://github.com/duyet/clickhouse-monitoring/commit/305341b72eadc9b4d8f63f106ed6741ce9c60176))
* **dashboard-tsr:** unblock main — chainable SSR stub + readonly string type ([#1488](https://github.com/duyet/clickhouse-monitoring/issues/1488)) ([4b84603](https://github.com/duyet/clickhouse-monitoring/commit/4b8460306c2d9362d33c069ccc876ef34dcc4bbc))
* **dashboard-tsr:** unmount collapsed query charts ([#1498](https://github.com/duyet/clickhouse-monitoring/issues/1498)) ([9584c68](https://github.com/duyet/clickhouse-monitoring/commit/9584c6846e0d04e1db11ecd8644f2966a1b6f580))
* **dashboard-tsr:** update readonly structural test for string value ([#1490](https://github.com/duyet/clickhouse-monitoring/issues/1490)) ([941d4e9](https://github.com/duyet/clickhouse-monitoring/commit/941d4e9004fa3d6ccd34792433db8db5ae159b42))
* **dashboard-tsr:** use 100dvh in explorer to match agents page ([#1463](https://github.com/duyet/clickhouse-monitoring/issues/1463)) ([9527ef1](https://github.com/duyet/clickhouse-monitoring/commit/9527ef1097ae7747563baca1680ed786127ab28b))
* **dashboard-tsr:** use grid skeleton for dashboard page loading state ([#1468](https://github.com/duyet/clickhouse-monitoring/issues/1468)) ([af05aa8](https://github.com/duyet/clickhouse-monitoring/commit/af05aa837708b4d5a8de3a17558702e684a63947))
* **dashboard-tsr:** use h-96 instead of h-screen for table redirect skeleton ([#1486](https://github.com/duyet/clickhouse-monitoring/issues/1486)) ([c767498](https://github.com/duyet/clickhouse-monitoring/commit/c76749879d9b39a2315a46456d2e4aa043bdd69a))
* **dashboard-tsr:** use port 8443 for Tailscale funnel ([#1539](https://github.com/duyet/clickhouse-monitoring/issues/1539)) ([49a9250](https://github.com/duyet/clickhouse-monitoring/commit/49a9250ba51c36dfa4e9611bbc2b88733f2f9d9b))
* **dashboard-tsr:** use shared ChartSkeleton/TableSkeleton in page skeletons ([#1470](https://github.com/duyet/clickhouse-monitoring/issues/1470)) ([bf592c4](https://github.com/duyet/clickhouse-monitoring/commit/bf592c456eb6d65f70e6b6d530592aacadd0f9d3))
* **dashboard-tsr:** use Skeleton shimmer in KpiCard loading state ([#1459](https://github.com/duyet/clickhouse-monitoring/issues/1459)) ([f44a9df](https://github.com/duyet/clickhouse-monitoring/commit/f44a9df4bd58d1df88d9d726abc1e4e7e1b10904))
* **dashboard-tsr:** wire table filterSchema + restore actions feature-auth ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([#1444](https://github.com/duyet/clickhouse-monitoring/issues/1444)) ([8d3ca79](https://github.com/duyet/clickhouse-monitoring/commit/8d3ca79cc11f29ff9a74e0f0bc7a2568c247dee5))
* **dashboard:** keep view state local so toggle clicks work in Cypress ([#1557](https://github.com/duyet/clickhouse-monitoring/issues/1557)) ([a216552](https://github.com/duyet/clickhouse-monitoring/commit/a2165524ac528c044e3268fb06fde4319f00888a))
* **docker:** copy tsconfig.base.json into builder stage ([#1556](https://github.com/duyet/clickhouse-monitoring/issues/1556)) ([e74c70a](https://github.com/duyet/clickhouse-monitoring/commit/e74c70a0741bd5992f11a865b1557a6177750530))
* **e2e:** green e2e-test and e2e-test-tsr on main ([#1558](https://github.com/duyet/clickhouse-monitoring/issues/1558)) ([bc6e451](https://github.com/duyet/clickhouse-monitoring/commit/bc6e451a12883e53fb0fea1741c7281bf7c360e5))
* enable rust build in docker jobs after WASM build removal ([#1552](https://github.com/duyet/clickhouse-monitoring/issues/1552)) ([6783aab](https://github.com/duyet/clickhouse-monitoring/commit/6783aab20fec81657ce4b1d093a2e0e70014b188))
* **explorer:** resolve dependency graph hydration mismatch and infinite loop ([#1510](https://github.com/duyet/clickhouse-monitoring/issues/1510)) ([e2d9618](https://github.com/duyet/clickhouse-monitoring/commit/e2d9618dd1627b62b34c652075f8112f4f21f127))
* green main — prerender crawl crashes and root Dockerfile tsconfig ([#1563](https://github.com/duyet/clickhouse-monitoring/issues/1563)) ([053fd62](https://github.com/duyet/clickhouse-monitoring/commit/053fd62dcd91e37cdea6390b9cad7c8333f1e312))
* **release:** remove duplicated Git changes and Docker tags from release notes ([#1442](https://github.com/duyet/clickhouse-monitoring/issues/1442)) ([4810b40](https://github.com/duyet/clickhouse-monitoring/commit/4810b404f49621c62c7983c8fe53f2d62a93ffbc))
* resolve TSR cutover blockers (hydration, layout, zoom dialog) ([#1527](https://github.com/duyet/clickhouse-monitoring/issues/1527)) ([fd187ce](https://github.com/duyet/clickhouse-monitoring/commit/fd187ceb99b5cc289a8a12eb5af80f889fa118a1))
* **sql-validator:** catch UNION ALL SELECT injection bypass ([#1475](https://github.com/duyet/clickhouse-monitoring/issues/1475)) ([0f15879](https://github.com/duyet/clickhouse-monitoring/commit/0f15879e33cba3e9743041e9d8b626a8ec48083a))
* switch root Dockerfile and docker-compose to dashboard-tsr ([#1548](https://github.com/duyet/clickhouse-monitoring/issues/1548)) ([03a3c44](https://github.com/duyet/clickhouse-monitoring/commit/03a3c4461bc49e0d15d4e8b1620b65ed19b95a46))
* **verify-deploy:** degrade ClickHouse-upstream timeouts to warnings ([8b5b16f](https://github.com/duyet/clickhouse-monitoring/commit/8b5b16f9a5523671f450324292f1da456d0f4300))


### ⚡ Performance

* **dashboard-tsr:** cache content-hashed assets immutably for lower TTFB ([#1507](https://github.com/duyet/clickhouse-monitoring/issues/1507)) ([8c26970](https://github.com/duyet/clickhouse-monitoring/commit/8c269709f8269749013fa4b06b1b8cd972e3b6fc))
* **dashboard-tsr:** combine SSR stubs for xyflow/streamdown/highlight.js/assistant-ui ([#1472](https://github.com/duyet/clickhouse-monitoring/issues/1472)) ([f7dfc4c](https://github.com/duyet/clickhouse-monitoring/commit/f7dfc4ce878ce8f6b1786b662bd71243e464ef63))
* **dashboard-tsr:** fix loading CLS drift + cut hidden-tab polling and re-renders ([#1515](https://github.com/duyet/clickhouse-monitoring/issues/1515)) ([1818e80](https://github.com/duyet/clickhouse-monitoring/commit/1818e803565134984026f721278ebb3e6232ffaa))
* **dashboard-tsr:** hover-prefetch, lazy-init providers, visibility-guard pollers ([#1544](https://github.com/duyet/clickhouse-monitoring/issues/1544)) ([ac3baeb](https://github.com/duyet/clickhouse-monitoring/commit/ac3baeb41d634540c805674a430f5156b4b57cb5))
* **dashboard-tsr:** make loading skeletons static for faster first paint ([#1506](https://github.com/duyet/clickhouse-monitoring/issues/1506)) ([d627154](https://github.com/duyet/clickhouse-monitoring/commit/d627154fb286e6967cc70e74724d1006036cc05f))
* **dashboard-tsr:** memoize data-table filter context and handlers ([#1524](https://github.com/duyet/clickhouse-monitoring/issues/1524)) ([12248d1](https://github.com/duyet/clickhouse-monitoring/commit/12248d13762a932817c0bb25b7703c7b4b762d30))
* **dashboard-tsr:** persist query cache + host list to localStorage for instant warm loads ([#1508](https://github.com/duyet/clickhouse-monitoring/issues/1508)) ([2d31e38](https://github.com/duyet/clickhouse-monitoring/commit/2d31e38a97f13d78ed571e79a4c5e7f4436148d6))
* **dashboard-tsr:** persist query cache to localStorage for instant repeat loads ([#1505](https://github.com/duyet/clickhouse-monitoring/issues/1505)) ([ae5b31f](https://github.com/duyet/clickhouse-monitoring/commit/ae5b31fe09320b2c84e7e7bc72b180182a66eae3))
* **dashboard-tsr:** set query gcTime to 30m for instant back-nav ([#1489](https://github.com/duyet/clickhouse-monitoring/issues/1489)) ([3413444](https://github.com/duyet/clickhouse-monitoring/commit/3413444f9b62a94178e60e4d3243f5cb4bc94c02))
* **dashboard-tsr:** stop background polling on hidden tabs and inactive chart tabs ([#1523](https://github.com/duyet/clickhouse-monitoring/issues/1523)) ([0591e7d](https://github.com/duyet/clickhouse-monitoring/commit/0591e7d83513191ff0fcdb58f29a06328234e879))
* **dashboard-tsr:** stub @json-render/shadcn + @json-render/react from SSR bundle ([#1477](https://github.com/duyet/clickhouse-monitoring/issues/1477)) ([76a6cfe](https://github.com/duyet/clickhouse-monitoring/commit/76a6cfe1c077ab8fc709b0c4660caf2e8f0ab891))
* **dashboard-tsr:** stub assistant-stream out of CF Worker bundle ([#1484](https://github.com/duyet/clickhouse-monitoring/issues/1484)) ([2f34d4f](https://github.com/duyet/clickhouse-monitoring/commit/2f34d4fe186b39cc646e59e29eee29247d177116))
* **dashboard-tsr:** stub recharts in SSR worker bundle (~1 MiB reduction) ([#1462](https://github.com/duyet/clickhouse-monitoring/issues/1462)) ([e719f7e](https://github.com/duyet/clickhouse-monitoring/commit/e719f7e791d479e1af9a7ddc042f844160a9d25f))


### ♻️ Refactoring

* **api:** cache headers, parallel queries, and shared validators in dashboard-tsr ([#1526](https://github.com/duyet/clickhouse-monitoring/issues/1526)) ([208c645](https://github.com/duyet/clickhouse-monitoring/commit/208c645621f4bae423c898e304c1a24d31d07b4e))
* **dashboard-tsr:** adopt activateOnEnterOrSpace in chart-empty + expandable-text ([#1495](https://github.com/duyet/clickhouse-monitoring/issues/1495)) ([3aa6bec](https://github.com/duyet/clickhouse-monitoring/commit/3aa6bec8854750c819736f35f4a4ae80b25e205c))
* **dashboard-tsr:** dedup components and fix false keeper-leader layout ([#1525](https://github.com/duyet/clickhouse-monitoring/issues/1525)) ([866a874](https://github.com/duyet/clickhouse-monitoring/commit/866a8741bdae3547e728ed4870cadf85d8090991))
* **dashboard-tsr:** docs route hygiene, dead hooks, lazy sql-formatter ([#1564](https://github.com/duyet/clickhouse-monitoring/issues/1564)) ([7cbed3d](https://github.com/duyet/clickhouse-monitoring/commit/7cbed3d6e10b78a1dd79a76e254b18bd1fb0e655))
* **dashboard-tsr:** extract activateOnEnterOrSpace a11y helper ([#1494](https://github.com/duyet/clickhouse-monitoring/issues/1494)) ([9b01572](https://github.com/duyet/clickhouse-monitoring/commit/9b015729db1c65381c4337a34f5b6bd50d1a87c6))
* **dashboard-tsr:** import zod directly instead of the zod/v3 compat shim ([#1521](https://github.com/duyet/clickhouse-monitoring/issues/1521)) ([6e55851](https://github.com/duyet/clickhouse-monitoring/commit/6e55851b9f599df7c32e9e54b063902a8cb379d9))
* **dashboard-tsr:** replace last swr usage with tanstack query, drop swr dep ([#1562](https://github.com/duyet/clickhouse-monitoring/issues/1562)) ([6ccb7f5](https://github.com/duyet/clickhouse-monitoring/commit/6ccb7f51751bd29e67267c16c9cceea50a70abce))
* **dashboard-tsr:** split + dedup large components for reuse ([#1392](https://github.com/duyet/clickhouse-monitoring/issues/1392)) ([#1449](https://github.com/duyet/clickhouse-monitoring/issues/1449)) ([966d96e](https://github.com/duyet/clickhouse-monitoring/commit/966d96e7dfe50c61490c37888f97707da0a6b4bf))

## [0.2.0] - 2026-01-08

### 🏗️ Major Architecture Changes

#### Static Site + SWR Migration
- **Migrated from SSR/dynamic routes to fully static site with client-side API routes**
  - Changed routing from `/[host]/overview` to `/overview?host=0` for better CDN caching
  - All pages are now static pre-rendered and served from edge
  - Client-side data fetching with SWR for real-time data updates
  - Benefits: Faster initial page load, better CDN distribution, simpler deployment

- **Data Fetching Pattern Overhaul**
  - Centralized data fetching through `/api/v1/*` API routes
  - All client components now use SWR hooks (`useChartData`, `useTableData`)
  - `fetchData()` now requires explicit `hostId` parameter (breaking change)
  - Introduced `useHostId()` hook to extract host from query parameters
  - Enables independent data refresh on host switching without full page reload

#### Framework & Build Updates
- **Next.js 15 with React 19** and Turbopack
- **Migrated to Bun** as the primary package manager
  - Better performance and compatibility with modern JavaScript ecosystem
  - Replaced PNPM with Bun (`bun install`, `bun run dev`, etc.)
- **Biome** for code formatting and linting (replacing ESLint/Prettier)
- **Bun test runner** replacing Jest for unit tests
  - Faster test execution and better Node.js compatibility
  - Note: Jest was experiencing hanging issues - Bun provides a stable alternative

#### Cloudflare Workers Deployment
- **Full support for Cloudflare Workers deployment**
  - Uses OpenNextJS for Next.js compatibility
  - API routes run on Workers using Fetch API
  - Hybrid static + API architecture
  - Deploy with: `bun run cf:deploy`
- **Enhanced CI/CD with Docker tagging strategy**
  - Release workflows with automatic Docker image versioning
  - Cloudflare deployment summaries in CI output

### ✨ New Features

#### UI/UX Enhancements
- **User Settings Modal**: Timezone and theme management per user
- **Settings Page**: Column ordering with drag-and-drop, context-aware help
- **Dark Mode Improvements**: Fixed ClickHouse logo visibility in dark mode
- **Command Palette**: Keyboard shortcuts for navigation
- **Readonly Tables Warning**: Indicator for replica tables in cluster overview

#### Data Explorer & Analytics
- **Page Views Analytics**: 4 new charts for usage insights (browsers, devices, pages, referrers)
- **Part Info Page**: Detailed information about ClickHouse table parts
- **Improved Table Validation**: Graceful handling of optional system tables (backup_log, error_log, zookeeper)

#### Developer Tools
- **Enhanced Query EXPLAIN**: Better visualization and context
- **Query Kill Functionality**: Kill long-running queries from UI
- **Zookeeper Explorer**: Monitor cluster coordination

### 🚀 Performance & Infrastructure

#### CDN & Caching
- **Static site architecture** enables aggressive CDN caching at edge
- **Query parameters routing** improves cache hit rates
- **Cloudflare Workers deployment** pre-renders static pages at edge
- **Supports multiple ClickHouse hosts** without cache invalidation

#### Database Query Optimization
- **Version-aware queries** using chronological `sql` arrays
  - Handle ClickHouse schema changes across versions (v23.8, v24.1, etc.)
  - Graceful degradation for missing columns/tables
- **Table validation system** with 5-minute caching
  - Prevents errors on optional tables
  - User-friendly error messages

#### Chart & Visualization
- **30+ metric charts** across all pages
- **Replaced donut charts with progress bars** for better readability
- **Heat maps** for visual performance analysis
- **Graceful error handling** during SWR revalidation preserves user experience

### 🛠️ Development & Testing

#### Testing Infrastructure
- **Cypress component tests** for UI validation
- **Cypress E2E tests** for user workflows
- **Bun test runner** for unit and integration tests
  - `bun run test` - Run all tests with coverage
  - `bun run test:unit` - Unit tests only
  - `bun run test:query-config` - ClickHouse query config validation
- **Query Config Validation**: Automated testing against multiple ClickHouse versions

#### Code Quality
- **Biome** for consistent formatting and linting
- **Type safety** with TypeScript 5
- **React Compiler** for automatic performance optimizations
- **Husky + lint-staged** for pre-commit checks

#### CI/CD Pipeline
- **GitHub Actions workflows** for automated testing and deployment
- **Claude Code integration** for AI-assisted code review
- **Multi-stage Docker builds** for optimized container images
- **Cloudflare Workers deployment** with automatic URL generation

### 🔄 Breaking Changes

1. **Routing**: `/[host]/overview` → `/overview?host=0`
   - Update bookmarks and API clients to use query parameter format

2. **API - `fetchData()` now requires `hostId`**:
   ```typescript
   // Old
   const data = await fetchData(query, variables)

   // New - hostId is required, not optional
   const data = await fetchData(query, variables, hostId)
   ```

3. **Component Props**: All chart/table components require `hostId` prop
   - `<MyChart hostId={hostId} />` instead of relying on context
   - Prevents prop drilling through explicit prop passing at usage site

4. **Package Manager**: Requires Bun 10.18.2+
   - `bun install` instead of `npm install`
   - `bun run dev` instead of `npm run dev`

### 📦 Dependencies

#### Major Upgrades
- React: 18 → 19
- Next.js: 13 → 15
- Tailwind CSS: 3 → 4
- TypeScript: 4 → 5
- Radix UI: Updated to latest versions with new primitives

#### New Dependencies
- `@dnd-kit/*` - Drag-and-drop functionality for column reordering
- `@xyflow/react` - Zookeeper explorer visualization
- `opennextjs-cloudflare` - Next.js on Cloudflare Workers
- `biome` - Code formatter and linter
- `sonner` - Toast notifications

### 🐛 Bug Fixes

- Fixed host switcher not triggering data refresh on navigation
- Fixed darkmode logo visibility issues
- Fixed cluster routing badge counts
- Fixed E2E test navigation with /tables redirect
- Fixed mock import order for Bun test runner
- Improved error handling in env-utils for client components

### 📊 Monitoring & Observability

- **Query Performance Monitoring**: Enhanced query detail page
- **Cluster Health Metrics**: Expanded system metrics coverage
- **Error Logging**: Better error context and user-friendly messages
- **Table Validation**: Prevents confusing errors from optional tables

### 📝 Documentation

- **Migration Guide**: From v0.1 dynamic routing to v0.2 static routing
- **Cloudflare Workers Deployment**: Complete setup and configuration guide
- **Schema Documentation**: Per-version ClickHouse schema compatibility
- **Development Conventions**: Code organization, patterns, and best practices
- **AI Generated Docs**: Available at zread.ai/duyet/clickhouse-monitoring

### 🎯 Comparison: v0.1.16 → v0.2.0

| Aspect | v0.1.16 | v0.2.0 |
|--------|---------|--------|
| **Architecture** | SSR + Dynamic Routes | Static Site + SWR API |
| **Routing** | `/[host]/overview` | `/overview?host=0` |
| **Build Tool** | Turbopack | Turbopack (same, optimized) |
| **Framework** | React 18 + Next.js 13 | React 19 + Next.js 15 |
| **Package Manager** | PNPM | Bun |
| **Linting** | ESLint + Prettier | Biome |
| **Testing** | Jest (with issues) | Bun test runner + Cypress |
| **Deployment** | Vercel + Docker | Vercel + Docker + Cloudflare Workers |
| **Pages** | ~12 static pages | ~15+ static pages + analytics |
| **Charts** | ~20 charts | ~30+ charts |
| **CDN Caching** | Limited (dynamic routes) | Aggressive (static pages) |
| **Load Time** | ~2-3s | ~0.5-1s (edge cache) |

### ⚠️ Known Issues & Limitations

- **Jest Test Runner**: Currently hangs indefinitely in CI environment
  - Workaround: Using Bun test runner instead
  - Alternative: Cypress for testing until resolved

- **Cloudflare Workers Build**: Requires Webpack instead of Turbopack
  - Performance impact during build (CF Workers compatibility requirement)

### 🔮 Future Improvements

- Real-time query streaming with WebSockets
- Advanced analytics dashboard
- Custom metric definitions
- Query performance history and trends
- Cluster topology visualization
- Advanced access control and RBAC

---

## [0.1.16] - Previous Release

For details on v0.1.x releases, see [GitHub Releases](https://github.com/duyet/clickhouse-monitoring/releases).

### Key Features (v0.1 era)

- Multi-host ClickHouse cluster monitoring
- 20+ metric visualization charts
- Query monitoring and management
- Cluster overview and analytics
- Database and table explorer
- Real-time system metrics
- Docker and Vercel deployment support

---

## Version History

- **0.2.0-beta.4** - Pre-release with migration features
- **0.2.0-beta.3** - Cloudflare Workers support
- **0.2.0-beta.2** - SWR migration improvements
- **0.2.0-beta.1** - Initial static site migration
- **0.1.16** - Final v0.1 release
- **0.1.0** - Initial release
