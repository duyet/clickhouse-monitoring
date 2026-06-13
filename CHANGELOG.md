# Changelog

All notable changes to this project are documented in this file.

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
