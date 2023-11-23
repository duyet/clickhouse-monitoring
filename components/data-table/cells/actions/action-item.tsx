'use client'

import { useState } from 'react'
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  UpdateIcon,
} from '@radix-ui/react-icons'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'

import { killQuery } from './actions'
import type { Action } from './types'

type Message = {
  message: string
}

interface ActionButtonProps {
  action: Action
  value: any
}

export function ActionItem({ action, value }: ActionButtonProps) {
  const { toast, dismiss } = useToast()
  const [status, updateStatus] = useState<
    'none' | 'loading' | 'success' | 'failed'
  >('none')

  const availableActions: {
    [key: string]: { label: string; handler: (_: FormData) => Promise<Message> }
  } = {
    'kill-query': {
      label: 'Kill Query',
      handler: killQuery.bind(null, value),
    },
  }

  const { label, handler } = availableActions[action]

  return (
    <form
      action={async (formData: FormData) => {
        updateStatus('loading')
        toast({ title: 'Message', description: 'Loading...' })

        try {
          const msg: Message = await handler(formData)
          console.debug('Action Response', msg)
          updateStatus('success')
          toast({ title: 'Message', description: msg.message })
        } catch (e) {
          updateStatus('failed')
          toast({ title: 'Error', description: `${e}`, variant: 'destructive' })
        } finally {
          dismiss()
        }
      }}
    >
      <DropdownMenuItem>
        {status == 'loading' && (
          <span className="flex flex-row items-center gap-2">
            <UpdateIcon className="h-4 w-4 animate-spin" /> {label}
          </span>
        )}

        {status == 'failed' && (
          <span className="flex flex-row items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />{' '}
            {label}
          </span>
        )}

        {status == 'success' && (
          <span className="flex flex-row items-center gap-2">
            <CheckCircledIcon className="h-4 w-4 text-lime-600" /> {label}
          </span>
        )}

        {status == 'none' && (
          <button type="submit" className="m-0 border-none p-0">
            {label}
          </button>
        )}
      </DropdownMenuItem>
    </form>
  )
}
