import { toClickHouseDocMarkdownUrl } from './clickhouse-doc-md-url'
import { describe, expect, it } from 'bun:test'

describe('toClickHouseDocMarkdownUrl', () => {
  const RAW_BASE =
    'https://raw.githubusercontent.com/ClickHouse/ClickHouse/refs/heads/master/docs/en/'

  it('converts a plain clickhouse docs URL', () => {
    const result = toClickHouseDocMarkdownUrl(
      'https://clickhouse.com/docs/operations/system-tables/disks'
    )
    expect(result).toBe(`${RAW_BASE}operations/system-tables/disks.md`)
  })

  it('converts a URL with /en/ prefix already present', () => {
    const result = toClickHouseDocMarkdownUrl(
      'https://clickhouse.com/docs/en/operations/system-tables/replicas'
    )
    expect(result).toBe(`${RAW_BASE}operations/system-tables/replicas.md`)
  })

  it('strips trailing slash before converting', () => {
    const result = toClickHouseDocMarkdownUrl(
      'https://clickhouse.com/docs/operations/system-tables/query_log/'
    )
    expect(result).toBe(`${RAW_BASE}operations/system-tables/query_log.md`)
  })

  it('strips fragment anchors', () => {
    const result = toClickHouseDocMarkdownUrl(
      'https://clickhouse.com/docs/operations/settings/merge-tree-settings#parts-to-delay-insert'
    )
    expect(result).toBe(`${RAW_BASE}operations/settings/merge-tree-settings.md`)
  })

  it('returns null for non-clickhouse-docs URLs', () => {
    expect(
      toClickHouseDocMarkdownUrl('https://example.com/docs/something')
    ).toBeNull()
  })

  it('returns null for a partial match (not a docs URL)', () => {
    expect(
      toClickHouseDocMarkdownUrl('https://clickhouse.com/blog/some-post')
    ).toBeNull()
  })

  it('returns null for an empty path after the docs prefix', () => {
    expect(
      toClickHouseDocMarkdownUrl('https://clickhouse.com/docs/')
    ).toBeNull()
  })

  it('converts a deeply nested path', () => {
    const result = toClickHouseDocMarkdownUrl(
      'https://clickhouse.com/docs/engines/table-engines/mergetree-family/replication'
    )
    expect(result).toBe(
      `${RAW_BASE}engines/table-engines/mergetree-family/replication.md`
    )
  })

  it('converts a URL with settings and anchor', () => {
    const result = toClickHouseDocMarkdownUrl(
      'https://clickhouse.com/docs/operations/settings/query-complexity#max_memory_usage'
    )
    expect(result).toBe(`${RAW_BASE}operations/settings/query-complexity.md`)
  })
})
