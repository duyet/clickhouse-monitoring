import { describe, expect, mock, test } from 'bun:test'

mock.module('server-only', () => ({}))

const { createDashboardTools } = await import('../dashboard-tools')

describe('createDashboardTools', () => {
  test('creates get_dashboard_pages and get_chart_data tools', () => {
    const tools = createDashboardTools() as any
    expect(tools.get_dashboard_pages).toBeDefined()
    expect(tools.get_chart_data).toBeDefined()
  })

  test('get_dashboard_pages returns list of pages', async () => {
    const tools = createDashboardTools() as any
    const result = await tools.get_dashboard_pages.execute({})

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(5)

    const paths = result.map((p: { path: string }) => p.path)
    expect(paths).toContain('/overview')
    expect(paths).toContain('/tables')
    expect(paths).toContain('/clusters')
    expect(paths).toContain('/running-queries')
    expect(paths).toContain('/explorer')
    expect(paths).toContain('/dashboard')

    for (const page of result) {
      expect(page.path).toBeDefined()
      expect(page.title).toBeDefined()
      expect(page.description).toBeDefined()
    }
  })

  test('get_chart_data returns guidance message', async () => {
    const tools = createDashboardTools() as any
    const result = await tools.get_chart_data.execute({ chartName: 'test' })

    expect(result.message).toContain('query tool')
  })

  test('get_chart_data ignores input and returns message', async () => {
    const tools = createDashboardTools() as any
    const result = await tools.get_chart_data.execute({})

    expect(result.message).toBeDefined()
  })
})
