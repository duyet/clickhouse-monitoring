import { createPlanTools } from '../plan-tools'
import { describe, expect, test } from 'bun:test'

type ExecuteFn = (input: unknown) => Promise<{
  type: string
  steps: Array<{ id: number; title: string; status: string }>
  note?: string
  total: number
  completed: number
  updatedAt: string
}>

function getExecute() {
  const tools = createPlanTools()
  const tool = tools.update_plan as unknown as { execute: ExecuteFn }
  return tool.execute
}

describe('update_plan', () => {
  test('exposes the update_plan tool', () => {
    const tools = createPlanTools()
    expect(tools.update_plan).toBeDefined()
  })

  test('normalizes steps with ids and defaults status to pending', async () => {
    const execute = getExecute()
    const result = await execute({
      steps: [
        { title: 'Scan query_log' },
        { title: 'Check merges', status: 'in_progress' },
        { title: 'Summarize', status: 'pending' },
      ],
    })

    expect(result.type).toBe('workflow_plan')
    expect(result.steps).toHaveLength(3)
    expect(result.steps[0]).toEqual({
      id: 1,
      title: 'Scan query_log',
      status: 'pending',
    })
    expect(result.steps[1].id).toBe(2)
    expect(result.steps[1].status).toBe('in_progress')
    expect(result.steps[2].id).toBe(3)
  })

  test('computes total and completed counts', async () => {
    const execute = getExecute()
    const result = await execute({
      steps: [
        { title: 'Step 1', status: 'completed' },
        { title: 'Step 2', status: 'completed' },
        { title: 'Step 3', status: 'in_progress' },
        { title: 'Step 4', status: 'pending' },
      ],
    })

    expect(result.total).toBe(4)
    expect(result.completed).toBe(2)
  })

  test('passes through an optional note', async () => {
    const execute = getExecute()
    const result = await execute({
      steps: [{ title: 'Only step' }],
      note: 'Investigating slow merges',
    })

    expect(result.note).toBe('Investigating slow merges')
  })

  test('omits note when not provided', async () => {
    const execute = getExecute()
    const result = await execute({ steps: [{ title: 'Only step' }] })

    expect(result.note).toBeUndefined()
  })

  test('returns an ISO timestamp', async () => {
    const execute = getExecute()
    const result = await execute({ steps: [{ title: 'Only step' }] })

    expect(() => new Date(result.updatedAt).toISOString()).not.toThrow()
    expect(result.updatedAt).toBe(new Date(result.updatedAt).toISOString())
  })
})
