import { buildTopologyModel, CH_RENDER_CAP, VB_H, VB_W } from '../model'
import {
  keepers,
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

  it('keeper hull degenerates: N=1 ring, N=2 capsule, N>=3 polygon', () => {
    const one = buildTopologyModel(replicatedCluster('c', 1), keepers(1))
    expect((one.keeperHull.match(/A /g) ?? []).length).toBe(2) // ring
    const two = buildTopologyModel(replicatedCluster('c', 1), keepers(2))
    expect((two.keeperHull.match(/A /g) ?? []).length).toBe(2) // capsule
    const three = buildTopologyModel(replicatedCluster('c', 1), keepers(3))
    expect((three.keeperHull.match(/A /g) ?? []).length).toBeGreaterThanOrEqual(
      3
    )
  })
})

describe('shared nodes land between their clusters (overlap lens)', () => {
  it('a host in 2 clusters sits between the two cluster centroids', () => {
    const model = buildTopologyModel(overlapClusters(), [])
    const a1 = model.nodeById['a-1']
    const b1 = model.nodeById['b-1']
    const shared = model.nodeById['shared']
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
      expect(n.y).toBeLessThan(VB_H)
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
