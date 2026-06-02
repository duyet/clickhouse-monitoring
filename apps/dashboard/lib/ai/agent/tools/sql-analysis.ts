import 'server-only'

import { validateSqlQuery } from '@chm/sql-builder'

export interface ReferencedTable {
  raw: string
  database: string
  table: string
  qualifiedName: string
}

export interface ReferencedColumn {
  name: string
  count: number
}

const TABLE_REFERENCE_PATTERN =
  /\b(?:FROM|JOIN)\s+((?:`[^`]+`|"[^"]+"|[a-zA-Z_][\w$]*)(?:\s*\.\s*(?:`[^`]+`|"[^"]+"|[a-zA-Z_][\w$]*))?)/gi

const WHERE_COLUMN_PATTERN =
  /\b(?:WHERE|AND|OR|PREWHERE|ON)\s+(?:\w+\.)?(`[^`]+`|"[^"]+"|[a-zA-Z_][\w$]*)\s*(?:=|!=|<>|<|>|<=|>=|\bIN\b|\bLIKE\b|\bILIKE\b|\bBETWEEN\b)/gi

const AGGREGATION_PATTERN =
  /\b(count|sum|avg|min|max|uniq|quantile|median|groupArray|groupUniqArray)\s*\(/i

const LIMIT_PATTERN = /\bLIMIT\s+\d+/i
const GROUP_BY_PATTERN = /\bGROUP\s+BY\b/i

function stripQuotedIdentifier(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('`') && trimmed.endsWith('`')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function normalizeIdentifier(value: string): string {
  return stripQuotedIdentifier(value.trim()).replace(/\s+/g, '')
}

export function validateAgentSql(sql: string): string {
  const trimmed = sql.trim().replace(/;+$/g, '')
  validateSqlQuery(trimmed)
  return trimmed
}

export function extractReferencedTables(
  sql: string,
  defaultDatabase = 'default'
): ReferencedTable[] {
  const tables = new Map<string, ReferencedTable>()

  for (const match of sql.matchAll(TABLE_REFERENCE_PATTERN)) {
    const raw = match[1]
    if (!raw || raw.startsWith('(')) continue

    const parts = raw.split('.').map(normalizeIdentifier).filter(Boolean)
    const database = parts.length > 1 ? parts[0] : defaultDatabase
    const table = parts.length > 1 ? parts[1] : parts[0]
    if (!database || !table) continue

    const qualifiedName = `${database}.${table}`
    if (!tables.has(qualifiedName)) {
      tables.set(qualifiedName, { raw, database, table, qualifiedName })
    }
  }

  return [...tables.values()]
}

export function extractWhereColumns(sql: string): ReferencedColumn[] {
  const counts = new Map<string, number>()

  for (const match of sql.matchAll(WHERE_COLUMN_PATTERN)) {
    const column = normalizeIdentifier(match[1])
    if (!column) continue
    counts.set(column, (counts.get(column) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function hasLimit(sql: string): boolean {
  return LIMIT_PATTERN.test(sql)
}

export function hasAggregation(sql: string): boolean {
  return AGGREGATION_PATTERN.test(sql) || GROUP_BY_PATTERN.test(sql)
}

export function isLikelyExploratorySelect(sql: string): boolean {
  const upper = sql.trim().toUpperCase()
  return (
    upper.startsWith('SELECT') &&
    !hasLimit(sql) &&
    !hasAggregation(sql) &&
    !upper.includes(' FORMAT ')
  )
}

export function quoteIdentifier(identifier: string): string {
  return `\`${identifier.replace(/`/g, '``')}\``
}

export function formatQualifiedTable(database: string, table: string): string {
  return `${quoteIdentifier(database)}.${quoteIdentifier(table)}`
}

export function scoreOrderByCandidate(columnName: string): number {
  const lower = columnName.toLowerCase()
  if (
    /(tenant|team|org|workspace|project|account|status|type|kind|level|country|region|env)/.test(
      lower
    )
  ) {
    return 10
  }
  if (/(date|day|month|hour)/.test(lower)) return 20
  if (/(time|timestamp|created|updated|event_time)/.test(lower)) return 30
  if (/(user|customer|session|device|host)/.test(lower)) return 40
  if (/(uuid|query_id|trace_id|span_id|event_id|id)$/.test(lower)) return 90
  return 50
}
