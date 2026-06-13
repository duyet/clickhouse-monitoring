import {
  getAllWorkflows,
  getWorkflow,
  registerWorkflow,
  unregisterWorkflow,
} from '../../workflows/registry'
import { createWorkflowTools } from '../workflow-tools'
import { afterEach, describe, expect, test } from 'bun:test'

type AnyExecute = (input: unknown) => Promise<Record<string, unknown>>

function tool(name: 'list_workflows' | 'start_workflow') {
  const tools = createWorkflowTools() as any
  return (tools[name] as unknown as { execute: AnyExecute }).execute
}

describe('workflow registry', () => {
  afterEach(() => {
    unregisterWorkflow('test-runtime-workflow')
  })

  test('ships built-in workflow templates', () => {
    const all = getAllWorkflows()
    const names = all.map((w) => w.name)
    expect(names).toContain('incident-investigation')
    expect(names).toContain('health-check')
    expect(names).toContain('query-optimization')
    expect(all.every((w) => w.steps.length > 0)).toBe(true)
  })

  test('getWorkflow returns a template by name', () => {
    const wf = getWorkflow('incident-investigation')
    expect(wf?.title).toBe('Incident Investigation')
    expect(wf?.source).toBe('builtin')
  })

  test('runtime workflows can be registered and override builtins', () => {
    registerWorkflow({
      name: 'test-runtime-workflow',
      title: 'Test Runtime',
      description: 'A runtime workflow',
      triggers: ['test'],
      steps: ['Step A', 'Step B'],
    })
    const wf = getWorkflow('test-runtime-workflow')
    expect(wf?.source).toBe('runtime')
    expect(wf?.steps).toEqual(['Step A', 'Step B'])
  })
})

describe('list_workflows', () => {
  test('returns the catalog of workflows', async () => {
    const result = await tool('list_workflows')({})
    expect(result.type).toBe('workflow_list')
    expect(Array.isArray(result.workflows)).toBe(true)
    expect((result.workflows as unknown[]).length).toBeGreaterThan(0)
  })
})

describe('start_workflow', () => {
  test('instantiates a template into a workflow_plan', async () => {
    const result = await tool('start_workflow')({
      workflow: 'health-check',
    })
    expect(result.type).toBe('workflow_plan')
    expect(result.workflow).toBe('Cluster Health Check')
    const steps = result.steps as Array<{ status: string }>
    expect(steps[0].status).toBe('in_progress')
    expect(steps.slice(1).every((s) => s.status === 'pending')).toBe(true)
  })

  test('customSteps replaces the template steps', async () => {
    const result = await tool('start_workflow')({
      workflow: 'health-check',
      customSteps: ['Only check disks', 'Report'],
    })
    const steps = result.steps as Array<{ title: string }>
    expect(steps).toHaveLength(2)
    expect(steps[0].title).toBe('Only check disks')
  })

  test('extraSteps appends to the template steps', async () => {
    const base = getWorkflow('health-check')?.steps.length ?? 0
    const result = await tool('start_workflow')({
      workflow: 'health-check',
      extraSteps: ['Verify the fix'],
    })
    const steps = result.steps as unknown[]
    expect(steps).toHaveLength(base + 1)
  })

  test('returns workflow_error for an unknown template', async () => {
    const result = await tool('start_workflow')({ workflow: 'does-not-exist' })
    expect(result.type).toBe('workflow_error')
    expect(Array.isArray(result.available)).toBe(true)
  })
})
