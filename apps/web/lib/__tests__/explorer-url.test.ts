import { buildExplorerQueryUrl } from '../explorer-url'
import { describe, expect, it } from 'bun:test'

describe('buildExplorerQueryUrl', () => {
  it('targets /explorer with the query tab pre-selected', () => {
    const url = buildExplorerQueryUrl('SELECT 1', 0)

    expect(url.startsWith('/explorer?')).toBe(true)
    expect(url).toContain('tab=query')
  })

  it('includes the host parameter as a stringified number', () => {
    expect(buildExplorerQueryUrl('SELECT 1', 3)).toContain('host=3')
  })

  it('base64-encodes the URL-encoded SQL into the q parameter', () => {
    const sql = 'SELECT * FROM users WHERE name = "alice"'
    const url = buildExplorerQueryUrl(sql, 0)

    const qParam = new URL(`http://x${url}`).searchParams.get('q')
    expect(qParam).not.toBeNull()
    const decoded = decodeURIComponent(atob(qParam as string))
    expect(decoded).toBe(sql)
  })

  it('round-trips SQL containing unicode and reserved characters', () => {
    const sql = "SELECT * FROM t WHERE col = 'café & 中文'"
    const url = buildExplorerQueryUrl(sql, 1)

    const qParam = new URL(`http://x${url}`).searchParams.get('q')
    const decoded = decodeURIComponent(atob(qParam as string))
    expect(decoded).toBe(sql)
  })

  it('round-trips an empty SQL string', () => {
    const url = buildExplorerQueryUrl('', 0)
    const qParam = new URL(`http://x${url}`).searchParams.get('q')
    expect(qParam).toBe('') // btoa(encodeURIComponent('')) === ''
  })
})
