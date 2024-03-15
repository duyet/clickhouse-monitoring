import { MoreHorizontal } from 'lucide-react'
import dynamic from 'next/dynamic'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { type Action } from './types'

export interface ActionMenuProps {
  row?: any
  value: any
  actions: Action[]
}

export function ActionMenu({ value, actions }: ActionMenuProps) {
  // Using dynamic import to avoid cypress components test error
  const ActionItem = dynamic(() =>
    import('./action-item').then((res) => res.ActionItem)
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action) => (
          <ActionItem key={action} value={value} action={action} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
