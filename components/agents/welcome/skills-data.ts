/**
 * Skills bundle definitions for the AI Agent page.
 *
 * A "skill" is a bundle of related tools the agent can invoke. The
 * `source: 'system'` skills are always available; `community` skills can be
 * toggled off so the user (or operator) can prune the tool surface.
 */

import {
  ActivityIcon,
  CpuIcon,
  DatabaseIcon,
  GitMergeIcon,
  HardDriveIcon,
  SearchIcon,
  ShieldIcon,
  SquareStackIcon,
  TableIcon,
  type LucideIcon,
} from 'lucide-react'

export type SkillSource = 'system' | 'community'

export interface Skill {
  id: string
  name: string
  description: string
  icon: LucideIcon
  source: SkillSource
  tools: readonly string[]
  defaultEnabled: boolean
}

export const SKILLS: readonly Skill[] = [
  {
    id: 'schema',
    name: 'Schema',
    description: 'Inspect databases, tables, columns, indexes',
    icon: TableIcon,
    source: 'system',
    tools: [
      'list_databases',
      'list_tables',
      'get_table_schema',
      'explore_table_schema',
      'show_indexes',
      'lookup_constraint',
    ],
    defaultEnabled: true,
  },
  {
    id: 'query',
    name: 'Query',
    description: 'Run, explain & optimize SQL on the cluster',
    icon: SearchIcon,
    source: 'system',
    tools: ['query', 'analyze_query_optimization', 'repair_query'],
    defaultEnabled: true,
  },
  {
    id: 'system',
    name: 'System',
    description: 'Read system tables — processes, metrics, settings',
    icon: ActivityIcon,
    source: 'system',
    tools: [
      'get_metrics',
      'get_running_queries',
      'get_slow_queries',
      'spot_issues',
      'get_merge_status',
    ],
    defaultEnabled: true,
  },
  {
    id: 'resources',
    name: 'Resources',
    description: 'CPU, memory, disk & network telemetry',
    icon: CpuIcon,
    source: 'system',
    tools: ['get_metrics', 'get_running_queries'],
    defaultEnabled: true,
  },
  {
    id: 'merges',
    name: 'Merges',
    description: 'Inspect & nudge MergeTree background ops',
    icon: GitMergeIcon,
    source: 'community',
    tools: ['get_merge_status', 'spot_issues'],
    defaultEnabled: false,
  },
  {
    id: 'storage',
    name: 'Storage',
    description: 'Disks, parts, retention & TTL analysis',
    icon: HardDriveIcon,
    source: 'community',
    tools: ['list_databases', 'list_tables', 'get_table_schema', 'spot_issues'],
    defaultEnabled: false,
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Users, grants, row-level policies',
    icon: ShieldIcon,
    source: 'community',
    tools: ['get_metrics', 'spot_issues', 'list_databases'],
    defaultEnabled: false,
  },
  {
    id: 'replication',
    name: 'Replication',
    description: 'Replicas, ZK queue, sync lag',
    icon: SquareStackIcon,
    source: 'community',
    tools: ['get_metrics', 'spot_issues', 'list_databases', 'list_tables'],
    defaultEnabled: false,
  },
] as const

export const SKILL_STORAGE_KEY = 'clickhouse-monitor-agent-skills'

export interface SkillState {
  /** Skill IDs that are explicitly turned off. */
  disabled: string[]
}

export function readSkillStorage(): SkillState {
  if (typeof window === 'undefined') return { disabled: [] }
  try {
    const raw = localStorage.getItem(SKILL_STORAGE_KEY)
    if (!raw) {
      return {
        disabled: SKILLS.filter((s) => !s.defaultEnabled).map((s) => s.id),
      }
    }
    const parsed = JSON.parse(raw) as SkillState
    return { disabled: Array.isArray(parsed.disabled) ? parsed.disabled : [] }
  } catch {
    return { disabled: [] }
  }
}

export function writeSkillStorage(state: SkillState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SKILL_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be disabled
  }
}

export function countActiveTools(activeSkillIds: readonly string[]): number {
  const set = new Set<string>()
  for (const id of activeSkillIds) {
    const skill = SKILLS.find((s) => s.id === id)
    if (!skill) continue
    for (const t of skill.tools) set.add(t)
  }
  return set.size
}

export function getDatabaseIcon(): LucideIcon {
  return DatabaseIcon
}
