import type { ActionMenuProps } from './actions/action-menu'
import { ActionMenu } from './actions/action-menu'

export function ActionFormat(props: ActionMenuProps) {
  return <ActionMenu {...props} />
}
