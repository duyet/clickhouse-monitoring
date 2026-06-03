import type { RowData } from '@tanstack/react-table'

import { ActionMenu, type ActionMenuProps } from './actions/action-menu'

export function ActionFormat<TData extends RowData, TValue>(
  props: ActionMenuProps<TData, TValue>
) {
  return <ActionMenu {...props} />
}
