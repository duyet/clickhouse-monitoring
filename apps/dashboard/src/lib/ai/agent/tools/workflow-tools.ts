import { z } from 'zod'

import { getAllWorkflows, getWorkflow } from '../workflows/registry'
import { buildWorkflowPlan, type WorkflowPlanOutput } from './plan-tools'
import { dynamicTool } from 'ai'

const MAX_STEPS = 20
const MAX_TITLE_LEN = 140

export interface WorkflowListOutput {
  type: 'workflow_list'
  workflows: Array<{
    name: string
    title: string
    description: string
    steps: string[]
    skills: string[]
  }>
}

/**
 * Creates the dynamic-workflow tools.
 *
 * - `list_workflows` enumerates the available workflow templates so the agent
 *   (or the user) can discover them.
 * - `start_workflow` instantiates a template into a live `workflow_plan`: the
 *   first step becomes `in_progress`, the rest `pending`. The agent can override
 *   or extend the template steps for dynamic adaptation, then continue updating
 *   the plan with `update_plan` as findings emerge.
 *
 * Both tools are pure — they read from the workflow registry and emit a payload
 * for the UI / model; they do not touch ClickHouse.
 */
export function createWorkflowTools() {
  return {
    list_workflows: dynamicTool({
      description:
        'List the available dynamic workflow templates (named multi-step runbooks). Use this to discover which workflow best fits the user request before calling start_workflow.',
      inputSchema: z.object({}),
      execute: async (): Promise<WorkflowListOutput> => {
        const workflows = getAllWorkflows().map((workflow) => ({
          name: workflow.name,
          title: workflow.title,
          description: workflow.description,
          steps: workflow.steps,
          skills: workflow.skills ?? [],
        }))
        return { type: 'workflow_list', workflows }
      },
    }),

    start_workflow: dynamicTool({
      description: `Start a dynamic workflow: instantiate a named runbook template into a live plan checklist. Pick the template whose purpose matches the user's request, then proceed through it, calling update_plan after each step. You can adapt the template dynamically:
- Pass customSteps to replace the template steps entirely (e.g. tailor to the specific table/host).
- Pass extraSteps to append steps to the template (e.g. add a verification step).
If no template fits, skip this and author the plan directly with update_plan instead.`,
      inputSchema: z.object({
        workflow: z
          .string()
          .describe(
            'Name of the workflow template to start (see list_workflows)'
          ),
        customSteps: z
          .array(z.string().min(1).max(MAX_TITLE_LEN))
          .min(1)
          .max(MAX_STEPS)
          .optional()
          .describe('Replace the template steps entirely with these'),
        extraSteps: z
          .array(z.string().min(1).max(MAX_TITLE_LEN))
          .max(MAX_STEPS)
          .optional()
          .describe('Append these steps to the template steps'),
        note: z
          .string()
          .max(280)
          .optional()
          .describe('Optional one-line summary of the current focus'),
      }),
      execute: async (
        input: unknown
      ): Promise<
        | WorkflowPlanOutput
        | { type: 'workflow_error'; error: string; available: string[] }
      > => {
        const { workflow, customSteps, extraSteps, note } = input as {
          workflow: string
          customSteps?: string[]
          extraSteps?: string[]
          note?: string
        }

        const template = getWorkflow(workflow)
        if (!template) {
          return {
            type: 'workflow_error',
            error: `Unknown workflow "${workflow}". Call list_workflows to see the available templates, or author the plan directly with update_plan.`,
            available: getAllWorkflows().map((w) => w.name),
          }
        }

        const baseSteps = customSteps ?? template.steps
        const titles = [...baseSteps, ...(extraSteps ?? [])].slice(0, MAX_STEPS)

        const steps = titles.map((title, index) => ({
          title,
          status: index === 0 ? ('in_progress' as const) : ('pending' as const),
        }))

        return buildWorkflowPlan(steps, {
          workflow: template.title,
          ...(note !== undefined ? { note } : {}),
        })
      },
    }),
  }
}
