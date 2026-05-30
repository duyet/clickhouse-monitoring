/**
 * Built-in dynamic workflow templates + registry.
 *
 * Templates are plain data so they can be composed, overridden, and extended at
 * runtime. `registerWorkflow()` lets server code add workflows dynamically
 * (e.g. cluster-specific runbooks), mirroring the dynamic skills loader.
 */

import type { WorkflowTemplate } from './types'

export const BUILTIN_WORKFLOWS: readonly WorkflowTemplate[] = [
  {
    name: 'incident-investigation',
    title: 'Incident Investigation',
    description:
      'Triage a reported problem: correlate symptoms across query log, errors, merges, and recent changes to find a root cause.',
    triggers: [
      'why is it slow',
      'something is wrong',
      'investigate the incident',
      'queries are failing',
      'production issue',
    ],
    steps: [
      'Scope the symptom and time window',
      'Run investigate_incident for correlated root cause',
      'Inspect failed and slow queries for the window',
      'Check system errors and resource pressure',
      'Summarize root cause and recommended fix',
    ],
    skills: ['troubleshooting'],
  },
  {
    name: 'health-check',
    title: 'Cluster Health Check',
    description:
      'Full health sweep: server state, disks, top tables, slow queries, errors, merges, and replication.',
    triggers: [
      'health check',
      'how is the cluster',
      'overall status',
      'is everything ok',
    ],
    steps: [
      'Gather server metrics and uptime',
      'Check disk usage and capacity headroom',
      'Review slow queries and recent errors',
      'Inspect merge backlog and replication status',
      'Summarize health with prioritized findings',
    ],
  },
  {
    name: 'query-optimization',
    title: 'Query Optimization',
    description:
      'Analyze and improve a slow query: explain the plan, check keys/indexes, and propose concrete rewrites.',
    triggers: [
      'optimize this query',
      'why is this query slow',
      'make this faster',
      'improve query performance',
    ],
    steps: [
      'Inspect the target table schema and sorting key',
      'Run explain_query and analyze_query_optimization',
      'Identify scan/index/JOIN inefficiencies',
      'Propose rewrites with PREWHERE, indexes, or MVs',
    ],
    skills: ['query-optimization'],
  },
  {
    name: 'capacity-planning',
    title: 'Capacity Planning',
    description:
      'Forecast storage and resource needs from recent growth trends and flag risks.',
    triggers: [
      'capacity planning',
      'when will the disk fill up',
      'forecast storage',
      'do we need more space',
    ],
    steps: [
      'Measure current disk usage and largest tables',
      'Run forecast_capacity on growth trends',
      'Project days-until-full and query volume trend',
      'Recommend TTL, tiering, or scaling actions',
    ],
    skills: ['storage-optimization'],
  },
  {
    name: 'replication-triage',
    title: 'Replication Triage',
    description:
      'Diagnose replication lag or failover: inspect status, queue backlog, and Keeper health.',
    triggers: [
      'replication lag',
      'replica is behind',
      'replication is stuck',
      'failover issue',
    ],
    steps: [
      'Check per-table replication status and lag',
      'Inspect the replication queue for stuck tasks',
      'Review ZooKeeper/Keeper and distributed DDL queue',
      'Summarize cause and recovery steps',
    ],
    skills: ['replication-guide'],
  },
  {
    name: 'migration-safety',
    title: 'Migration Safety Review',
    description:
      'Assess a proposed schema change before applying it: blast radius, table state, and risk class.',
    triggers: [
      'is this alter safe',
      'review this migration',
      'schema change impact',
      'can I drop this column',
    ],
    steps: [
      'Inspect current table state, parts, and mutations',
      'Run analyze_schema_change on the proposed ALTER',
      'Assess column usage and blast radius',
      'Recommend a safe, ordered migration plan',
    ],
    skills: ['migration-patterns'],
  },
]

/** Runtime-registered workflows, keyed by name. */
const runtimeWorkflows: Map<string, WorkflowTemplate> = new Map()

/**
 * Deep-clone a workflow so callers can't mutate registry/builtin state through
 * shared array references (steps, triggers, skills).
 */
function cloneWorkflow(workflow: WorkflowTemplate): WorkflowTemplate {
  return {
    ...workflow,
    triggers: [...workflow.triggers],
    steps: [...workflow.steps],
    ...(workflow.skills ? { skills: [...workflow.skills] } : {}),
  }
}

/**
 * Register (or override) a workflow template at runtime. Runtime templates take
 * precedence over builtins with the same name.
 */
export function registerWorkflow(workflow: WorkflowTemplate): void {
  runtimeWorkflows.set(workflow.name, {
    ...cloneWorkflow(workflow),
    source: 'runtime',
  })
}

/** Remove a runtime-registered workflow. Builtins cannot be removed. */
export function unregisterWorkflow(name: string): boolean {
  return runtimeWorkflows.delete(name)
}

/** Get every available workflow (runtime overrides take precedence). */
export function getAllWorkflows(): WorkflowTemplate[] {
  const byName = new Map<string, WorkflowTemplate>()
  for (const workflow of BUILTIN_WORKFLOWS) {
    byName.set(workflow.name, { ...cloneWorkflow(workflow), source: 'builtin' })
  }
  for (const [name, workflow] of runtimeWorkflows) {
    byName.set(name, cloneWorkflow(workflow))
  }
  return [...byName.values()]
}

/** Look up a single workflow by name (runtime overrides take precedence). */
export function getWorkflow(name: string): WorkflowTemplate | undefined {
  return getAllWorkflows().find((workflow) => workflow.name === name)
}

/** Stable list of workflow names for tool enums and docs. */
export function getWorkflowNames(): string[] {
  return getAllWorkflows().map((workflow) => workflow.name)
}
