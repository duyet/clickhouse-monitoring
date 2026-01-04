'use client'

import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  UpdateIcon,
} from '@radix-ui/react-icons'
import { toast } from 'sonner'
import type { Row, RowData } from '@tanstack/react-table'

import type { Action } from './types'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useActions } from '@/lib/swr'

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
  const router = useRouter()
  const { killQuery, optimizeTable, querySettings } = useActions()

  const availableActions: {
    [key: string]: {
      label: string
      handler: () => Promise<{ success: boolean; message: string }>
    }
  } = {
    'kill-query': {
      label: 'Kill Query',
      handler: () => killQuery(String(value)),
    },
    'explain-query': {
      label: 'Explain Query',
      handler: async () => {
        const query = row.getValue('query') || ''
        return {
          success: true,
          message: `/explain?query=${encodeURIComponent(String(query))}`,
        }
      },
    },
    optimize: {
      label: 'Optimize Table',
      handler: () => optimizeTable(String(value)),
    },
    'query-settings': {
      label: 'Query Settings',
      handler: () => querySettings(String(value)),
    },
  }

  const actionConfig = availableActions[action]
  if (!actionConfig) return null

  const { label, handler } = actionConfig

  const handleClick = async () => {
    updateStatus('loading')
    toast.loading('Loading...')

    try {
      const result = await handler()

      if (action === 'explain-query' && result.success) {
        router.push(result.message)
        return
      }

      if (result.success) {
        updateStatus('success')
        toast.dismiss()
        toast.success(result.message)
      } else {
        updateStatus('failed')
        toast.dismiss()
        toast.error(result.message)
      }
    } catch (e) {
      updateStatus('failed')
      toast.dismiss()
      toast.error(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  return (
    <DropdownMenuItem onClick={handleClick} className="cursor-pointer">
      {status === 'loading' && (
        <span className="flex flex-row items-center gap-2">
          <UpdateIcon className="size-4 animate-spin" /> {label}
        </span>
      )}

      {status === 'failed' && (
        <span className="flex flex-row items-center gap-2">
          <ExclamationTriangleIcon className="size-4 text-orange-500" /> {label}
        </span>
      )}

      {status === 'success' && (
        <span className="flex flex-row items-center gap-2">
          <CheckCircledIcon className="size-4 text-lime-600" /> {label}
        </span>
      )}

      {status === 'none' && <span>{label}</span>}
    </DropdownMenuItem>
  )
}
