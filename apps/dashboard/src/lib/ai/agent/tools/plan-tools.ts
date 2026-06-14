import { z } from 'zod'

import { dynamicTool } from 'ai'

const MAX_STEPS = 20
const MAX_TITLE_LEN = 140
const MAX_NOTE_LEN = 280

export type PlanStepStatus = 'pending' | 'in_progress' | 'completed'

export interface WorkflowPlanStep {
  id: number
  title: string
  status: PlanStepStatus
}

export interface WorkflowPlanOutput {
  type: 'workflow_plan'
  steps: WorkflowPlanStep[]
  note?: string
  /** Human-readable workflow title when the plan came from a template. */
  workflow?: string
  total: number
  completed: number
  updatedAt: string
}

/**
 * Normalize a raw step list into a `workflow_plan` payload. Shared by the
 * `update_plan` tool and the `start_workflow` tool so both emit an identical
 * shape for the UI to render.
 */
export function buildWorkflowPlan(
  steps: Array<{ title: string; status?: PlanStepStatus }>,
  options: { note?: string; workflow?: string } = {}
): WorkflowPlanOutput {
  const normalized: WorkflowPlanStep[] = steps.map((step, index) => ({
    id: index + 1,
    title: step.title,
    status: step.status ?? 'pending',
  }))

  const completed = normalized.filter(
    (step) => step.status === 'completed'
  ).length

  return {
    type: 'workflow_plan',
    steps: normalized,
    ...(options.note !== undefined ? { note: options.note } : {}),
    ...(options.workflow !== undefined ? { workflow: options.workflow } : {}),
    total: normalized.length,
    completed,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Creates the `update_plan` harness tool.
 *
 * This gives the agent an explicit, user-visible workflow: a checklist of the
 * steps it intends to take for a multi-step investigation. The agent calls this
 * once at the start to lay out the plan, then again after finishing each step to
 * mark progress. The frontend renders the latest plan as a live checklist, so the
 * user always knows where the agent is in its workflow.
 *
 * The tool is pure (no ClickHouse access) — it simply normalizes and echoes the
 * plan back so the UI can render it and the model retains the plan in context.
 *
 * @returns An object containing the `update_plan` tool that emits a
 * `{ type: 'workflow_plan', steps, note, total, completed, updatedAt }` payload.
 */
export function createPlanTools() {
  return {
    update_plan: dynamicTool({
      description: `Create or update a step-by-step workflow plan for the current investigation. Use this as a lightweight planning harness:
- Call it ONCE at the start of any multi-step task (3+ steps) to lay out the plan with all steps set to "pending".
- Call it AGAIN after completing each step to mark that step "completed" and the next one "in_progress".
- Keep exactly ONE step "in_progress" at a time; everything before it should be "completed" and everything after "pending".
- Keep step titles short and action-oriented (e.g. "Scan query_log for slow queries", "Check merge backlog", "Summarize findings").
Do NOT use this for single-step answers — only when the work genuinely spans multiple tool calls or phases.`,
      inputSchema: z.object({
        steps: z
          .array(
            z.object({
              title: z
                .string()
                .min(1)
                .max(MAX_TITLE_LEN)
                .describe('Short, action-oriented description of the step'),
              status: z
                .enum(['pending', 'in_progress', 'completed'])
                .optional()
                .describe('Step status (default: pending)'),
            })
          )
          .min(1)
          .max(MAX_STEPS)
          .describe('Ordered list of workflow steps'),
        note: z
          .string()
          .max(MAX_NOTE_LEN)
          .optional()
          .describe('Optional one-line summary of the current focus or status'),
        workflow: z
          .string()
          .max(MAX_TITLE_LEN)
          .optional()
          .describe(
            'Optional workflow title to keep displayed when adapting a plan started via start_workflow'
          ),
      }),
      execute: async (input: unknown): Promise<WorkflowPlanOutput> => {
        const { steps, note, workflow } = input as {
          steps: Array<{ title: string; status?: PlanStepStatus }>
          note?: string
          workflow?: string
        }

        return buildWorkflowPlan(steps, { note, workflow })
      },
    }),
  }
}
