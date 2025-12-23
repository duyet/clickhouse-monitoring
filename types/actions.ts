import { FileSearch, Zap, XCircle } from 'lucide-react'

import type { Icon } from '@/types/icon'

/**
 * Action definition with metadata
 */
export interface ActionDefinition {
  /** Unique action identifier */
  id: string
  /** Display label */
  label: string
  /** Lucide icon component */
  icon?: Icon
  /** Variant for styling */
  variant?: 'default' | 'destructive' | 'warning'
  /** Required row fields for this action */
  requires?: string[]
  /** Confirmation dialog config */
  confirm?: {
    title: string
    description: string
    confirmLabel?: string
  }
}

/**
 * Built-in action definitions
 */
const BUILT_IN_ACTIONS: Record<string, ActionDefinition> = {
  'kill-query': {
    id: 'kill-query',
    label: 'Kill Query',
    icon: XCircle as unknown as Icon,
    variant: 'destructive',
    requires: ['query_id'],
    confirm: {
      title: 'Kill Query',
      description: 'Are you sure you want to kill this query?',
    },
  },
  'explain-query': {
    id: 'explain-query',
    label: 'Explain Query',
    icon: FileSearch as unknown as Icon,
    requires: ['query'],
  },
  optimize: {
    id: 'optimize',
    label: 'Optimize Table',
    icon: Zap as unknown as Icon,
    variant: 'destructive',
    requires: ['database', 'table'],
    confirm: {
      title: 'Optimize Table',
      description: 'This may take a while for large tables.',
    },
  },
}

/**
 * Action registry - extensible at runtime
 */
const actionRegistry = new Map<string, ActionDefinition>(
  Object.entries(BUILT_IN_ACTIONS)
)

/**
 * Register a custom action
 *
 * @param action - Action definition to register
 * @throws {Error} If action ID is already registered
 *
 * @example
 * ```ts
 * registerAction({
 *   id: 'my-action',
 *   label: 'My Custom Action',
 *   icon: CustomIcon,
 *   requires: ['field1', 'field2'],
 * })
 * ```
 */
export function registerAction(action: ActionDefinition): void {
  if (actionRegistry.has(action.id)) {
    throw new Error(`Action with id "${action.id}" is already registered`)
  }
  actionRegistry.set(action.id, action)
}

/**
 * Type-safe action reference
 * Union of all registered action IDs plus extensibility for custom actions
 */
export type Action = keyof typeof BUILT_IN_ACTIONS | (string & {})

/**
 * Get action metadata by ID
 *
 * @param id - Action ID to retrieve
 * @returns Action definition or undefined if not found
 *
 * @example
 * ```ts
 * const killAction = getAction('kill-query')
 * if (killAction?.confirm) {
 *   // Show confirmation dialog
 * }
 * ```
 */
export function getAction(id: Action): ActionDefinition | undefined {
  return actionRegistry.get(id)
}

/**
 * Get all registered actions
 *
 * @returns Array of all registered action definitions
 *
 * @example
 * ```ts
 * const allActions = getAllActions()
 * allActions.forEach(action => console.log(action.label))
 * ```
 */
export function getAllActions(): ActionDefinition[] {
  return Array.from(actionRegistry.values())
}

/**
 * Check if an action requires confirmation
 *
 * @param id - Action ID to check
 * @returns True if action has confirmation config
 *
 * @example
 * ```ts
 * if (requiresConfirmation('kill-query')) {
 *   // Show confirmation dialog
 * }
 * ```
 */
export function requiresConfirmation(id: Action): boolean {
  const action = getAction(id)
  return action?.confirm !== undefined
}

/**
 * Check if action has all required fields in row data
 *
 * @param id - Action ID to check
 * @param rowData - Row data object to validate
 * @returns True if all required fields are present and not empty
 *
 * @example
 * ```ts
 * if (isActionAvailable('kill-query', row)) {
 *   // Show action button
 * }
 * ```
 */
export function isActionAvailable(
  id: Action,
  rowData: Record<string, unknown>
): boolean {
  const action = getAction(id)
  if (!action?.requires) {
    return true
  }
  return action.requires.every(
    (field) => field in rowData && rowData[field] !== null && rowData[field] !== ''
  )
}
