import dagre from '@dagrejs/dagre'

/**
 * Shared dagre auto-layout for React Flow graphs.
 *
 * Both the explorer dependency graph and the PeerDB peer graph need the same
 * core: feed nodes + edges to dagre, then convert dagre's center-anchored
 * coordinates to React Flow's top-left anchor. This helper owns that core so
 * the two graphs can't drift. Callers decide which node ids to lay out (e.g.
 * only connected nodes) and place any remaining nodes themselves.
 */

export interface DagreLayoutOptions {
  direction?: 'TB' | 'LR'
  nodeWidth: number
  nodeHeight: number
  nodesep?: number
  ranksep?: number
  marginx?: number
  marginy?: number
}

/**
 * Run dagre on the given node ids + edges and return TOP-LEFT positions keyed
 * by node id. Only ids passed in are laid out; edges referencing absent nodes
 * are skipped so callers can pass a subset (e.g. connected nodes only).
 */
export function computeDagrePositions(
  nodeIds: string[],
  edges: ReadonlyArray<{ source: string; target: string }>,
  options: DagreLayoutOptions
): Map<string, { x: number; y: number }> {
  const {
    direction = 'TB',
    nodeWidth,
    nodeHeight,
    nodesep = 60,
    ranksep = 80,
    marginx = 40,
    marginy = 40,
  } = options

  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: direction, nodesep, ranksep, marginx, marginy })

  for (const id of nodeIds) {
    graph.setNode(id, { width: nodeWidth, height: nodeHeight })
  }
  for (const edge of edges) {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(graph)

  const positions = new Map<string, { x: number; y: number }>()
  for (const id of nodeIds) {
    const node = graph.node(id)
    if (node) {
      positions.set(id, {
        x: node.x - nodeWidth / 2,
        y: node.y - nodeHeight / 2,
      })
    }
  }
  return positions
}
