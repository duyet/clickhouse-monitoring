/**
 * Dynamic workflow types.
 *
 * A workflow is a reusable, data-driven template for a multi-step
 * investigation. The agent picks a template at runtime, instantiates it into a
 * live plan (see `start_workflow`), then adapts the plan as findings emerge (see
 * `update_plan`). Templates are data, not code, so they can be extended at
 * runtime via the registry — the same pattern used by the skills loader.
 */

export type WorkflowSource = 'builtin' | 'runtime'

export interface WorkflowTemplate {
  /** Stable kebab-case identifier, e.g. `incident-investigation`. */
  name: string
  /** Human-readable title shown in the UI, e.g. `Incident Investigation`. */
  title: string
  /** One-line summary of what the workflow accomplishes. */
  description: string
  /** Example user phrases that should trigger this workflow. */
  triggers: string[]
  /** Ordered list of step titles used to seed the plan. */
  steps: string[]
  /** Skills the agent should consider loading for this workflow. */
  skills?: string[]
  /** Where the template came from (builtin vs registered at runtime). */
  source?: WorkflowSource
}
