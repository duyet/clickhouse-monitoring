'use client'

import {
  Background,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  Panel,
  Position,
  ReactFlow,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { getEngineIconConfig } from '@/lib/clickhouse-engine-icons'
import { cn } from '@/lib/utils'

/**
 * Dependency type indicating the nature of the relationship
 */
export type DependencyType =
  | 'dependency' // Standard MV/View dependency from system.tables
  | 'dictGet' // dictGet() function call in definition
  | 'joinGet' // joinGet() function call in definition
  | 'mv_target' // MV writes TO this table
  | 'dict_source' // Dictionary source table
  | 'external' // External engine (PostgreSQL, Kafka, etc.)

/**
 * Dependency data from the API
 */
export interface DependencyEdge {
  source_database: string
  source_table: string
  source_engine: string
  target_database?: string
  target_table?: string
  dependency_type?: DependencyType
  extra_info?: string
}

interface DependencyGraphProps {
  dependencies: DependencyEdge[]
  currentTable?: string
  currentDatabase?: string
  hostId: number
  className?: string
}

/**
 * Custom node component for tables/views
 */
function TableNode({
  data,
}: {
  data: {
    label: string
    engine: string
    database: string
    isCurrent: boolean
    hostId: number
  }
}) {
  const engineConfig = getEngineIconConfig(data.engine)
  const Icon = engineConfig.icon

  return (
    <div
      className={cn(
        'rounded-lg border bg-card px-3 py-2 shadow-sm transition-all',
        data.isCurrent
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Link
        href={`/explorer?host=${data.hostId}&database=${encodeURIComponent(data.database)}&table=${encodeURIComponent(data.label)}&engine=${encodeURIComponent(data.engine)}`}
        className="flex items-center gap-2"
      >
        <Icon
          className={cn('size-4 shrink-0', engineConfig.color)}
          aria-label={data.engine}
        />
        <div className="flex flex-col">
          <span
            className={cn(
              'text-sm font-medium',
              data.isCurrent && 'text-primary'
            )}
          >
            {data.label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {data.engine}
          </span>
        </div>
      </Link>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
      />
    </div>
  )
}

const nodeTypes = {
  tableNode: TableNode,
}

/**
 * Legend item component for dependency type (shadcn badge style)
 */
function LegendItem({
  color,
  label,
  dashed,
}: {
  color: string
  label: string
  dashed?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="12" className="shrink-0">
        <line
          x1="0"
          y1="6"
          x2="24"
          y2="6"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? '4,3' : undefined}
        />
        <polygon points="20,3 24,6 20,9" fill={color} />
      </svg>
      <span
        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
        style={{
          backgroundColor: `${color}15`,
          color: color,
          border: `1px solid ${color}30`,
        }}
      >
        {label}
      </span>
    </div>
  )
}

/**
 * Get engine category for grouping
 */
function getEngineCategory(engine: string): string {
  if (engine === 'Dictionary') return 'dict'
  if (engine === 'MaterializedView') return 'mv'
  if (engine === 'View') return 'view'
  if (engine.includes('PostgreSQL') || engine.includes('MySQL'))
    return 'external'
  return 'table'
}

/**
 * Get edge color based on dependency type
 */
function getDependencyColor(type?: DependencyType): string {
  switch (type) {
    case 'dictGet':
      return '#f97316' // orange-500
    case 'joinGet':
      return '#8b5cf6' // violet-500
    case 'mv_target':
      return '#22c55e' // green-500
    case 'dict_source':
      return '#f59e0b' // amber-500
    case 'external':
      return '#94a3b8' // slate-400
    default:
      return '#3b82f6' // blue-500 for MV/View
  }
}

/**
 * Get edge label based on dependency type
 */
function getDependencyLabel(type?: DependencyType): string | undefined {
  switch (type) {
    case 'dictGet':
      return 'dictGet'
    case 'joinGet':
      return 'joinGet'
    case 'mv_target':
      return 'TO'
    case 'dict_source':
      return 'source'
    default:
      return undefined
  }
}

/**
 * Find connected components using Union-Find algorithm
 */
function findConnectedComponents(
  nodeKeys: string[],
  edges: Array<{ source: string; target: string }>
): Map<string, number> {
  const parent = new Map<string, string>()
  const rank = new Map<string, number>()

  // Initialize
  for (const key of nodeKeys) {
    parent.set(key, key)
    rank.set(key, 0)
  }

  function find(x: string): string {
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!))
    }
    return parent.get(x)!
  }

  function union(x: string, y: string) {
    const px = find(x)
    const py = find(y)
    if (px === py) return
    const rx = rank.get(px)!
    const ry = rank.get(py)!
    if (rx < ry) {
      parent.set(px, py)
    } else if (rx > ry) {
      parent.set(py, px)
    } else {
      parent.set(py, px)
      rank.set(px, rx + 1)
    }
  }

  // Union connected nodes
  for (const edge of edges) {
    if (parent.has(edge.source) && parent.has(edge.target)) {
      union(edge.source, edge.target)
    }
  }

  // Assign component IDs
  const componentRoots = new Map<string, number>()
  const nodeComponents = new Map<string, number>()
  let componentId = 0

  for (const key of nodeKeys) {
    const root = find(key)
    if (!componentRoots.has(root)) {
      componentRoots.set(root, componentId++)
    }
    nodeComponents.set(key, componentRoots.get(root)!)
  }

  return nodeComponents
}

/**
 * Calculate hierarchical levels based on dependency direction
 * Level 0 = root tables (no outgoing deps)
 * Higher levels = tables that depend on lower levels
 */
function calculateLevels(
  nodeKeys: string[],
  edges: Array<{ source: string; target: string }>
): Map<string, number> {
  const levels = new Map<string, number>()
  const outgoing = new Map<string, Set<string>>()
  const incoming = new Map<string, Set<string>>()

  // Initialize
  for (const key of nodeKeys) {
    outgoing.set(key, new Set())
    incoming.set(key, new Set())
    levels.set(key, 0)
  }

  // Build adjacency
  for (const edge of edges) {
    outgoing.get(edge.source)?.add(edge.target)
    incoming.get(edge.target)?.add(edge.source)
  }

  // BFS from roots (nodes with no outgoing edges or targets)
  const visited = new Set<string>()
  const queue: string[] = []

  // Find root nodes (targets that nothing points to, or have no dependencies)
  for (const key of nodeKeys) {
    const out = outgoing.get(key)!
    if (out.size === 0) {
      levels.set(key, 0)
      queue.push(key)
      visited.add(key)
    }
  }

  // If no roots found, start from nodes with no incoming
  if (queue.length === 0) {
    for (const key of nodeKeys) {
      const inc = incoming.get(key)!
      if (inc.size === 0) {
        levels.set(key, 0)
        queue.push(key)
        visited.add(key)
      }
    }
  }

  // BFS to assign levels
  while (queue.length > 0) {
    const current = queue.shift()!
    const currentLevel = levels.get(current)!

    // Process nodes that point TO this node (they should be one level up)
    for (const source of incoming.get(current) || []) {
      if (!visited.has(source)) {
        levels.set(source, Math.max(levels.get(source)!, currentLevel + 1))
        visited.add(source)
        queue.push(source)
      }
    }
  }

  // Handle any remaining unvisited nodes
  for (const key of nodeKeys) {
    if (!visited.has(key)) {
      levels.set(key, 0)
    }
  }

  return levels
}

/**
 * Build nodes and edges from dependency data with smart grouping
 * Uses hierarchical layout with connected components grouped together
 */
function buildGraph(
  dependencies: DependencyEdge[],
  currentTable: string | undefined,
  currentDatabase: string | undefined,
  hostId: number
): { nodes: Node[]; edges: Edge[]; edgeCount: number } {
  const nodeMap = new Map<
    string,
    { database: string; table: string; engine: string }
  >()
  const edgeList: Array<{ source: string; target: string }> = []
  const edges: Edge[] = []

  // Collect all unique tables and build edge list
  for (const dep of dependencies) {
    const sourceKey = `${dep.source_database}.${dep.source_table}`
    if (!nodeMap.has(sourceKey)) {
      nodeMap.set(sourceKey, {
        database: dep.source_database,
        table: dep.source_table,
        engine: dep.source_engine,
      })
    }

    if (dep.target_table && dep.target_database) {
      const targetKey = `${dep.target_database}.${dep.target_table}`
      if (!nodeMap.has(targetKey)) {
        nodeMap.set(targetKey, {
          database: dep.target_database,
          table: dep.target_table,
          engine: 'Table',
        })
      }

      edgeList.push({ source: sourceKey, target: targetKey })

      // Create styled edge
      const edgeColor = getDependencyColor(dep.dependency_type)
      const edgeLabel = getDependencyLabel(dep.dependency_type)
      edges.push({
        id: `${sourceKey}->${targetKey}-${dep.dependency_type || 'dep'}`,
        source: sourceKey,
        target: targetKey,
        animated: dep.dependency_type === 'mv_target',
        label: edgeLabel,
        labelStyle: edgeLabel
          ? {
              fill: 'hsl(var(--foreground))',
              fontSize: 9,
              fontWeight: 500,
            }
          : undefined,
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        labelBgStyle: edgeLabel
          ? {
              fill: edgeColor,
              fillOpacity: 0.15,
              stroke: edgeColor,
              strokeWidth: 1,
            }
          : undefined,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 16,
          height: 16,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
          strokeDasharray:
            dep.dependency_type === 'external' ? '5,5' : undefined,
        },
      })
    }
  }

  const nodeKeys = Array.from(nodeMap.keys())

  // Find connected components and calculate levels
  const components = findConnectedComponents(nodeKeys, edgeList)
  const levels = calculateLevels(nodeKeys, edgeList)

  // Group nodes by component, then by level
  const componentGroups = new Map<number, Map<number, string[]>>()
  for (const key of nodeKeys) {
    const comp = components.get(key) || 0
    const level = levels.get(key) || 0

    if (!componentGroups.has(comp)) {
      componentGroups.set(comp, new Map())
    }
    const levelMap = componentGroups.get(comp)!
    if (!levelMap.has(level)) {
      levelMap.set(level, [])
    }
    levelMap.get(level)!.push(key)
  }

  // Sort components: connected ones first (by size), then isolated nodes
  const sortedComponents = Array.from(componentGroups.entries()).sort(
    ([, a], [, b]) => {
      const sizeA = Array.from(a.values()).reduce((s, arr) => s + arr.length, 0)
      const sizeB = Array.from(b.values()).reduce((s, arr) => s + arr.length, 0)
      // Components with connections first
      const hasEdgesA = a.size > 1 || (a.get(0)?.length || 0) < sizeA
      const hasEdgesB = b.size > 1 || (b.get(0)?.length || 0) < sizeB
      if (hasEdgesA !== hasEdgesB) return hasEdgesA ? -1 : 1
      return sizeB - sizeA // Larger components first
    }
  )

  // Layout constants
  const NODE_WIDTH = 200
  const NODE_HEIGHT = 55
  const H_GAP = 30
  const V_GAP = 80 // More vertical space for edges
  const COMPONENT_GAP = 60

  const nodes: Node[] = []
  let currentX = 0

  // Position each component
  for (const [, levelMap] of sortedComponents) {
    const sortedLevels = Array.from(levelMap.entries()).sort(
      ([a], [b]) => b - a
    ) // Higher levels (sources) at top

    let maxWidth = 0
    let componentY = 0

    for (const [, nodesAtLevel] of sortedLevels) {
      // Sort nodes at this level by engine category then name
      nodesAtLevel.sort((a, b) => {
        const infoA = nodeMap.get(a)!
        const infoB = nodeMap.get(b)!
        const catA = getEngineCategory(infoA.engine)
        const catB = getEngineCategory(infoB.engine)
        if (catA !== catB) return catA.localeCompare(catB)
        return infoA.table.localeCompare(infoB.table)
      })

      const levelWidth = nodesAtLevel.length * (NODE_WIDTH + H_GAP) - H_GAP
      maxWidth = Math.max(maxWidth, levelWidth)

      // Center nodes at this level
      const startX = currentX + (maxWidth - levelWidth) / 2

      nodesAtLevel.forEach((key, index) => {
        const info = nodeMap.get(key)!
        nodes.push({
          id: key,
          type: 'tableNode',
          position: {
            x: startX + index * (NODE_WIDTH + H_GAP),
            y: componentY,
          },
          data: {
            label: info.table,
            engine: info.engine,
            database: info.database,
            isCurrent:
              info.table === currentTable && info.database === currentDatabase,
            hostId,
          },
        })
      })

      componentY += NODE_HEIGHT + V_GAP
    }

    currentX += maxWidth + COMPONENT_GAP
  }

  return { nodes, edges, edgeCount: edges.length }
}

/**
 * Dependency graph visualization using React Flow
 */
export function DependencyGraph({
  dependencies,
  currentTable,
  currentDatabase,
  hostId,
  className,
}: DependencyGraphProps) {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  const {
    nodes: initialNodes,
    edges: initialEdges,
    edgeCount,
  } = useMemo(
    () => buildGraph(dependencies, currentTable, currentDatabase, hostId),
    [dependencies, currentTable, currentDatabase, hostId]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // Fit view when nodes change
  useEffect(() => {
    if (reactFlowInstance.current && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.current?.fitView({ padding: 0.1 })
      }, 50)
    }
  }, [nodes])

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance
    // Initial fit view
    setTimeout(() => {
      instance.fitView({ padding: 0.1 })
    }, 100)
  }, [])

  if (dependencies.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border bg-muted/10 text-muted-foreground',
          className
        )}
      >
        No tables found
      </div>
    )
  }

  return (
    <div className={cn('w-full rounded-lg border', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          animated: true,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <Panel position="top-right" className="text-xs text-muted-foreground">
          {nodes.length} tables{edgeCount > 0 && `, ${edgeCount} dependencies`}
        </Panel>
        {/* Legend panel - only show when there are edges */}
        {edgeCount > 0 && (
          <Panel
            position="bottom-left"
            className="rounded-lg border bg-card/95 p-2.5 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-2 text-xs font-medium text-foreground">
              Dependency Types
            </div>
            <div className="flex flex-col gap-1.5">
              <LegendItem color="#3b82f6" label="MV/View" />
              <LegendItem color="#f97316" label="dictGet" />
              <LegendItem color="#8b5cf6" label="joinGet" />
              <LegendItem color="#22c55e" label="TO" />
              <LegendItem color="#f59e0b" label="source" />
              <LegendItem color="#94a3b8" label="external" dashed />
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}
