'use client'

import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  UpdateIcon,
} from '@radix-ui/react-icons'
import type { Row, RowData } from '@tanstack/react-table'
import { redirect } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

import {
  explainQuery,
  killQuery,
  optimizeTable,
  querySettings,
} from './actions'
import type { Action, ActionResponse } from './types'

interface ActionButtonProps<TData extends RowData, TValue> {
  row: Row<TData>
  action: Action
  value: TValue
}

export function ActionItem<TData extends RowData, TValue>({
  row,
  action,
  value,
}: ActionButtonProps<TData, TValue>) {
  const [status, updateStatus] = useState<
    'none' | 'loading' | 'success' | 'failed'
  >('none')

  const availableActions: {
    [key: string]: {
      label: string
      handler: (_: FormData) => Promise<ActionResponse>
    }
  } = {
    'kill-query': {
      label: 'Kill Query',
      handler: killQuery.bind(null, value),
    },
    'explain-query': {
      label: 'Explain Query',
      handler: (formData: FormData) => explainQuery(row, formData),
    },
    optimize: {
      label: 'Optimize Table',
      handler: optimizeTable.bind(null, value),
    },
    'query-settings': {
      label: 'Query Settings',
      handler: querySettings.bind(null, value),
    },
  }

  const { label, handler } = availableActions[action] || {
    label: action,
    handler: null,
  }

  return (
    <form
      action={async (formData: FormData) => {
        updateStatus('loading')
        toast.loading('Loading...')

        try {
          const resp: ActionResponse = await handler(formData)
          console.log('Trigger Action', resp)

          if (resp.action === 'toast') {
            updateStatus('success')
            toast(resp.message)
          } else if (resp.action === 'redirect') {
            redirect(resp.message)
          }
        } catch (e) {
          console.error('Action Error', e)
          updateStatus('failed')
          toast.error(`${e}`)
        }
      }}
    >
      <DropdownMenuItem>
        {status === 'loading' && (
          <span className="flex flex-row items-center gap-2">
            <UpdateIcon className="size-4 animate-spin" /> {label}
          </span>
        )}

        {status === 'failed' && (
          <span className="flex flex-row items-center gap-2">
            <ExclamationTriangleIcon className="size-4 text-orange-500" />{' '}
            {label}
          </span>
        )}

        {status === 'success' && (
          <span className="flex flex-row items-center gap-2">
            <CheckCircledIcon className="size-4 text-lime-600" /> {label}
          </span>
        )}

        {status === 'none' && (
          <button type="submit" className="m-0 border-none p-0">
            {label}
          </button>
        )}
      </DropdownMenuItem>
    </form>
  )
}
