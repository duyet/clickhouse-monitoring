/**
 * Build a URL that opens a SQL query in the Data Explorer query tab.
 */
export function buildExplorerQueryUrl(sql: string, hostId: number): string {
  const params = new URLSearchParams()
  params.set('host', String(hostId))
  params.set('tab', 'query')
  params.set('q', btoa(encodeURIComponent(sql)))
  return `/explorer?${params.toString()}`
}
