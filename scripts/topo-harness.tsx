/**
 * Dev-only verification harness for the cluster-topology canvas.
 *
 * Renders the REAL <TopoCanvas> (via react-dom/server) for representative
 * fixtures into a standalone HTML page with the app's true OKLCH theme vars, so
 * label overlaps / boundary spills can be eyeballed + screenshotted. NOT shipped.
 *
 *   bun run scripts/topo-harness.tsx > /tmp/topo.html
 */

import type { KeeperInfoRow } from '../apps/web/components/cluster-topology/model'

import {
  chRow,
  keepers,
  localDuplicateClusters,
  overlapClusters,
} from '../apps/web/components/cluster-topology/__tests__/fixtures'
import { buildTopologyModel } from '../apps/web/components/cluster-topology/model'
import { TopoCanvas } from '../apps/web/components/cluster-topology/topo-canvas'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

/** Three logical clusters over the SAME three hosts → concentric nested rings,
 * exercising the downward pill stacking + leader lines. */
const coincidentClusters = () =>
  ['all-replicated-cluster', 'all-sharded', 'analytics'].flatMap((cluster) =>
    [0, 1, 2].map((i) =>
      chRow({
        cluster,
        host_name: `chi-clickhouse-cluster-0-${i}.clickhouse.svc.cluster.local`,
        host_address: `10.0.0.${10 + i}`,
        shard_num: i + 1,
        replica_num: 1,
        database_shard_name: 'sh',
      })
    )
  )

/** Keepers with real FQDN hosts (matches the reported screenshot). */
const fqdnKeepers = (n: number): KeeperInfoRow[] =>
  Array.from({ length: n }, (_, i) => ({
    host: `clickhouse-keeper-${i}.clickhouse-keeper.svc.cluster.local`,
    port: 9181,
    is_connected: 1,
    is_leader: i === 0 ? 1 : 0,
    server_state: i === 0 ? 'leader' : 'follower',
    avg_latency: i,
  }))

const liveFor = (model: ReturnType<typeof buildTopologyModel>) => {
  const live: Record<string, { cpuPct: number | null; memPct: number | null }> =
    {}
  model.chNodes.forEach((n, i) => {
    live[n.id] = { cpuPct: 1 + i * 7, memPct: 2 + i * 5 }
  })
  return live
}

const scenarios: {
  name: string
  model: ReturnType<typeof buildTopologyModel>
}[] = [
  {
    name: 'local-duplicate (screenshot): 3 keepers + cluster pods',
    model: buildTopologyModel(localDuplicateClusters(), fqdnKeepers(3)),
  },
  {
    name: 'overlap: two clusters share a host, single keeper',
    model: buildTopologyModel(overlapClusters(), keepers(1)),
  },
  {
    name: 'coincident: 3 logical clusters over the same 3 hosts (nested rings)',
    model: buildTopologyModel(coincidentClusters(), fqdnKeepers(3)),
  },
]

const cards = scenarios
  .map(({ name, model }) => {
    const svg = renderToStaticMarkup(
      h(TopoCanvas, {
        model,
        liveById: liveFor(model),
        selected: null,
        activeCluster: null,
        onSelect: () => {},
        onClearSelect: () => {},
      })
    )
    return `<section><h2>${name}</h2><div class="frame">${svg}</div></section>`
  })
  .join('\n')

// Real OKLCH theme tokens (light root) from apps/web/app/globals.css.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root{
    --background:oklch(1 0 0); --foreground:oklch(0.145 0 0);
    --card:oklch(1 0 0); --muted:oklch(0.97 0 0);
    --muted-foreground:oklch(0.556 0 0); --primary:oklch(0.205 0 0);
    --border:oklch(0.922 0 0);
  }
  body{margin:0;background:var(--background);font-family:ui-sans-serif,system-ui;color:var(--foreground)}
  section{padding:24px}
  h2{font-size:14px;font-weight:600;margin:0 0 8px;color:var(--muted-foreground)}
  .frame{border:1px solid var(--border);border-radius:12px;background:var(--background);
    aspect-ratio:1280/580;width:100%;max-width:1280px;overflow:hidden}
  .frame svg{width:100%;height:100%}
</style></head><body>${cards}</body></html>`

process.stdout.write(html)
