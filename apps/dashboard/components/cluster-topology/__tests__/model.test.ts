import { buildTopologyModel, CH_RENDER_CAP, VB_H, VB_W } from '../model'
import {
  keepers,
  localDuplicateClusters,
  mixedCluster,
  overlapClusters,
  replicatedCluster,
  shardedCluster,
} from './fixtures'
import { describe, expect, it } from 'bun:test'

const NODE_COUNTS = [1, 2, 3, 5, 12]

describe('buildTopologyModel — cluster overlay hulls for every shape', () => {
  for (const n of NODE_COUNTS) {
    it(`replicated cluster with ${n} replicas → one non-empty closed hull`, () => {
      const model = buildTopologyModel(replicatedCluster('repl', n), [])
      const hull = model.clusterHulls.find((h) => h.id === 'repl')
      expect(hull).toBeDefined()
      expect(hull?.d).not.toBe('')
      expect(hull?.d.trim().endsWith('Z')).toBe(true)
      expect(hull?.d.trim().startsWith('M')).toBe(true)
    })
  }

  it('sharded cluster draws NO replication edges; replicated does', () => {
    const sharded = buildTopologyModel(shardedCluster('sh', 4), [])
    expect(sharded.replEdges.length).toBe(0)

    const repl = buildTopologyModel(replicatedCluster('rp', 3), [])
    expect(repl.replEdges.length).toBeGreaterThan(0)
  })

  it('mixed (2 shards × 3 replicas) links replicas within each shard only', () => {
    const model = buildTopologyModel(mixedCluster('mx', 2, 3), [])
    // 2 shards × (3 replicas → 2 consecutive links) = 4 edges, no cross-shard links
    expect(model.replEdges.length).toBe(4)
  })
})

describe('z-order is area DESCENDING', () => {
  it('larger hull is listed before smaller', () => {
    const rows = [
      ...shardedCluster('big', 5), // spread wide → big area
      ...replicatedCluster('small', 2), // 2 nodes → smaller
    ]
    const model = buildTopologyModel(rows, [])
    const areas = model.clusterHulls.map((h) => h.area)
    for (let i = 1; i < areas.length; i++) {
      expect(areas[i - 1]).toBeGreaterThanOrEqual(areas[i])
    }
  })
})

describe('keeper quorum hull is optional', () => {
  for (const k of [0, 1, 3, 5]) {
    it(`keeper count ${k}`, () => {
      const model = buildTopologyModel(replicatedCluster('c', 3), keepers(k))
      expect(model.keepers.length).toBe(k)
      if (k === 0) {
        // keeper.source === none → render NO keeper region
        expect(model.keeperHull).toBe('')
        expect(model.coordEdges.length).toBe(0)
        expect(model.raftEdges.length).toBe(0)
      } else {
        expect(model.keeperHull).not.toBe('')
        // generalized quorum: full mesh among keepers
        expect(model.raftEdges.length).toBe((k * (k - 1)) / 2)
      }
    })
  }

  it('keeper region is a closed rounded rectangle (4 corner arcs) for any N', () => {
    for (const k of [1, 2, 3, 5]) {
      const m = buildTopologyModel(replicatedCluster('c', 1), keepers(k))
      expect(m.keeperHull).not.toBe('')
      expect(m.keeperHull.trim().startsWith('M')).toBe(true)
      expect(m.keeperHull.trim().endsWith('Z')).toBe(true)
      expect((m.keeperHull.match(/A /g) ?? []).length).toBe(4)
    }
  })

  it('keeper hull stays inside the viewBox after centerContent', () => {
    for (const k of [1, 3, 5]) {
      const m = buildTopologyModel(replicatedCluster('c', 3), keepers(k))
      // Parse the rounded-rect path to extract bounding coordinates.
      // roundedRectPath produces: M x y H ... V ... H ... A arcs ... Z
      // The first M gives us the top-left corner.
      const nums = m.keeperHull.match(/[-\d.]+/g)?.map(Number) ?? []
      // First two numbers are the top-left x,y of the rect.
      const minX = nums[0]
      const minY = nums[1]
      expect(minX).toBeGreaterThanOrEqual(0)
      expect(minY).toBeGreaterThanOrEqual(0)
      // Width and height are the 3rd/4th numbers in the H/V commands.
      // Approximate: no hull coordinate should exceed the viewBox.
      for (const v of nums) {
        expect(v).toBeGreaterThanOrEqual(-10) // small margin for envelope padding
        expect(v).toBeLessThanOrEqual(Math.max(VB_W, m.vbHeight) + 10)
      }
    }
  })
})

describe('shared nodes land between their clusters (overlap lens)', () => {
  it('a host in 2 clusters sits between the two cluster centroids', () => {
    const model = buildTopologyModel(overlapClusters(), [])
    const a1 = model.nodeById['a-1']
    const b1 = model.nodeById['b-1']
    const shared = model.nodeById.shared
    expect(a1 && b1 && shared).toBeTruthy()
    // shared host x lies between the two exclusive members' x positions
    const lo = Math.min(a1.x, b1.x)
    const hi = Math.max(a1.x, b1.x)
    expect(shared.x).toBeGreaterThanOrEqual(lo - 1)
    expect(shared.x).toBeLessThanOrEqual(hi + 1)
    // both cluster hulls exist and (sharing a node) their paths are present
    expect(model.clusterHulls.length).toBe(2)
    // dedup: the shared host is ONE node, not two
    expect(model.counts.chNodes).toBe(3)
  })
})

describe('local-duplicate merge (localhost === chi-...-0-0)', () => {
  it('collapses the local server listed under two names into ONE node', () => {
    const model = buildTopologyModel(localDuplicateClusters(), [])
    // 4 rows, but localhost + chi-...-0-0 are the same machine → 3 nodes
    expect(model.counts.chNodes).toBe(3)
    // the surviving local node keeps the descriptive FQDN-derived id, not localhost
    const local = model.chNodes.find((n) => n.isLocal)
    expect(local).toBeDefined()
    expect(local?.id).toBe('chi-clickhouse-cluster-0-0')
    expect(model.chNodes.some((n) => n.id === 'localhost')).toBe(false)
    // and it belongs to BOTH clusters → it sits inside both territories
    const dflt = model.clusters.find((c) => c.name === 'default')
    const oper = model.clusters.find((c) => c.name === 'cluster')
    expect(dflt?.members[local!.id]).toBeDefined()
    expect(oper?.members[local!.id]).toBeDefined()
  })

  it('does NOT merge distinct remote nodes that only share a loopback addr', () => {
    // remote replicas all defaulting host_address to 127.0.0.1 stay separate
    const model = buildTopologyModel(replicatedCluster('repl', 3), [])
    expect(model.counts.chNodes).toBe(3)
  })
})

describe('large N respects CH_RENDER_CAP without breaking counts', () => {
  it('renders at most CH_RENDER_CAP glyphs but reports the true total', () => {
    const big = shardedCluster('huge', 60)
    const model = buildTopologyModel(big, [])
    expect(model.counts.chNodes).toBe(60) // true count preserved
    expect(model.chNodes.length).toBeLessThanOrEqual(CH_RENDER_CAP)
    // every rendered node has a real position inside the viewBox
    for (const n of model.chNodes) {
      expect(n.x).toBeGreaterThan(0)
      expect(n.x).toBeLessThan(VB_W)
      expect(n.y).toBeGreaterThan(0)
      expect(n.y).toBeLessThan(model.vbHeight)
    }
  })
})

describe('determinism across rebuilds (stable for live ticks)', () => {
  it('identical structural input → identical layout + hulls', () => {
    const rows = [...replicatedCluster('a', 3), ...shardedCluster('b', 2)]
    const m1 = buildTopologyModel(rows, keepers(3))
    const m2 = buildTopologyModel(rows, keepers(3))
    expect(m1.clusterHulls.map((h) => h.d)).toEqual(
      m2.clusterHulls.map((h) => h.d)
    )
    expect(m1.chNodes.map((n) => [n.x, n.y])).toEqual(
      m2.chNodes.map((n) => [n.x, n.y])
    )
    expect(m1.keeperHull).toBe(m2.keeperHull)
    expect(m1.vbHeight).toBe(m2.vbHeight)
  })
})

describe('data-driven viewBox height', () => {
  it('never drops below the VB_H floor and is deterministic', () => {
    // A sparse single-node graph fits within the floor; a deeply-nested,
    // multi-cluster graph must grow taller than it to keep its rings + pills in.
    const sparse = buildTopologyModel(replicatedCluster('c', 1), keepers(1))
    expect(sparse.vbHeight).toBeGreaterThanOrEqual(VB_H)

    // Same 3 hosts under 3 cluster names → coincident concentric rings (the deep
    // nesting that previously climbed into the keeper region).
    const nestedRows = ['all-replicated', 'all-sharded', 'analytics'].flatMap(
      (cluster) => replicatedCluster(cluster, 3, 'shared')
    )
    const nested = buildTopologyModel(nestedRows, keepers(3))
    expect(nested.vbHeight).toBeGreaterThanOrEqual(VB_H)
    // Deeper nesting reserves strictly more vertical room than the sparse case.
    expect(nested.vbHeight).toBeGreaterThan(sparse.vbHeight)
  })

  it('hiding physical clusters drops their hulls and shrinks the height', () => {
    // 2 physical (default, all-replicated) + 1 logical, same hosts.
    const rows = [
      ...replicatedCluster('default', 3, 'shared'),
      ...replicatedCluster('all-replicated', 3, 'shared'),
      ...replicatedCluster('analytics', 3, 'shared'),
    ]
    const shown = buildTopologyModel(rows, keepers(3), [], [], 'none', {
      showPhysical: true,
    })
    const hidden = buildTopologyModel(rows, keepers(3), [], [], 'none', {
      showPhysical: false,
    })
    // Physical hulls present when shown, gone when hidden.
    expect(shown.clusterHulls.some((h) => h.outline)).toBe(true)
    expect(hidden.clusterHulls.some((h) => h.outline)).toBe(false)
    // The logical hull survives either way.
    expect(hidden.clusterHulls.filter((h) => !h.outline).length).toBe(1)
    // Counts are structural truth regardless of visibility.
    expect(hidden.counts.physical).toBe(shown.counts.physical)
    // Dropping the outer physical rings lets the viewBox shrink.
    expect(hidden.vbHeight).toBeLessThan(shown.vbHeight)
    // Layout is logical-driven: horizontal positions and the relative vertical
    // arrangement are unchanged (only the whole composition re-centers in the
    // now-shorter viewBox, so absolute y shifts uniformly).
    expect(hidden.chNodes.map((n) => n.x)).toEqual(
      shown.chNodes.map((n) => n.x)
    )
    const spread = (m: typeof shown) => {
      const ys = m.chNodes.map((n) => n.y)
      return Math.max(...ys) - Math.min(...ys)
    }
    expect(spread(hidden)).toBeCloseTo(spread(shown), 5)
  })

  it('keeps every CH cluster box BELOW the keeper region (keepers stay outside)', () => {
    // Coincident clusters over the same hosts produce the deep concentric rings
    // that previously climbed into the keeper region. The topmost cluster-rect
    // edge must sit below the lowest keeper glyph/label.
    const rows = ['all-replicated', 'all-sharded', 'analytics'].flatMap(
      (cluster) => replicatedCluster(cluster, 3, 'shared')
    )
    const m = buildTopologyModel(rows, keepers(3))
    const keeperBottom = Math.max(...m.keepers.map((k) => k.y))
    // Each hull path starts "M x y …"; the second number is the rect's top edge.
    for (const h of m.clusterHulls) {
      const topY = h.d.match(/[-\d.]+/g)?.map(Number)[1] ?? 0
      expect(topY).toBeGreaterThan(keeperBottom)
    }
  })
})

describe('cluster-count matrix {1,2,3,5}', () => {
  for (const c of [1, 2, 3, 5]) {
    it(`${c} logical clusters each render a hull`, () => {
      const rows = Array.from({ length: c }, (_, i) =>
        replicatedCluster(`cl${i}`, 2)
      ).flat()
      const model = buildTopologyModel(rows, [])
      const filled = model.clusterHulls.filter((h) => !h.outline)
      expect(filled.length).toBe(c)
      for (const h of filled) expect(h.d).not.toBe('')
    })
  }
})
