import { buildExplorerQueryUrl } from './explorer-url'
import { describe, expect, it } from 'bun:test'

describe('buildExplorerQueryUrl', () => {
  it('returns a URL starting with /explorer', () => {
    const url = buildExplorerQueryUrl('SELECT 1', 0)
    expect(url.startsWith('/explorer?')).toBe(true)
  })

  it('includes host param matching hostId', () => {
    const url = buildExplorerQueryUrl('SELECT 1', 0)
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('host')).toBe('0')
  })

  it('always sets tab=query', () => {
    const url = buildExplorerQueryUrl('SELECT 1', 0)
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('tab')).toBe('query')
  })

  it('encodes sql as btoa(encodeURIComponent(sql))', () => {
    const sql = 'SELECT 1'
    const url = buildExplorerQueryUrl(sql, 0)
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('q')).toBe(btoa(encodeURIComponent(sql)))
  })

  it('uses the provided hostId correctly', () => {
    for (const hostId of [0, 1, 2, 99]) {
      const url = buildExplorerQueryUrl('SELECT 1', hostId)
      const params = new URLSearchParams(url.split('?')[1])
      expect(params.get('host')).toBe(String(hostId))
    }
  })

  it('handles SQL with special characters (spaces, stars, quotes)', () => {
    const sql = `SELECT * FROM "my table" WHERE name = 'foo'`
    const url = buildExplorerQueryUrl(sql, 0)
    const params = new URLSearchParams(url.split('?')[1])
    const decoded = decodeURIComponent(atob(params.get('q') as string))
    expect(decoded).toBe(sql)
  })

  it('handles SQL with unicode characters', () => {
    const sql = 'SELECT 🚀, "日本語" FROM t'
    const url = buildExplorerQueryUrl(sql, 0)
    const params = new URLSearchParams(url.split('?')[1])
    const decoded = decodeURIComponent(atob(params.get('q') as string))
    expect(decoded).toBe(sql)
  })

  it('handles multi-line SQL', () => {
    const sql =
      "SELECT\n  a,\n  b\nFROM\n  system.tables\nWHERE database = 'default'\nLIMIT 100"
    const url = buildExplorerQueryUrl(sql, 0)
    const params = new URLSearchParams(url.split('?')[1])
    const decoded = decodeURIComponent(atob(params.get('q') as string))
    expect(decoded).toBe(sql)
  })

  it('handles empty SQL string', () => {
    const sql = ''
    const url = buildExplorerQueryUrl(sql, 0)
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('q')).toBe(btoa(encodeURIComponent(sql)))
  })

  it('handles long SQL queries', () => {
    const sql = `SELECT ${'col, '.repeat(50)} 1 FROM system.columns LIMIT 1000`
    const url = buildExplorerQueryUrl(sql, 5)
    const params = new URLSearchParams(url.split('?')[1])
    const decoded = decodeURIComponent(atob(params.get('q') as string))
    expect(decoded).toBe(sql)
    expect(params.get('host')).toBe('5')
  })

  it('has exactly three query params: host, tab, q', () => {
    const url = buildExplorerQueryUrl('SELECT 1', 0)
    const params = new URLSearchParams(url.split('?')[1])
    const keys = [...params.keys()]
    expect(keys).toEqual(['host', 'tab', 'q'])
  })

  it('round-trips correctly: decode reverses the encoding', () => {
    const sql =
      "SELECT count() FROM system.query_log WHERE type = 'QueryFinish'"
    const url = buildExplorerQueryUrl(sql, 3)
    const params = new URLSearchParams(url.split('?')[1])
    const q = params.get('q') as string
    const roundTripped = decodeURIComponent(atob(q))
    expect(roundTripped).toBe(sql)
  })
})
