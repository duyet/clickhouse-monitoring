'use client'

import { CheckCircle2Icon, CircleXIcon, LoaderIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { useHostId } from '@/lib/swr'

type ConnectionStatus = 'loading' | 'connected' | 'error'

export function ConnectionStatusBadge() {
  const hostId = useHostId()
  const [status, setStatus] = useState<ConnectionStatus>('loading')

  useEffect(() => {
    // Reset when host changes
    setStatus('loading')

    // Simple health check - fetch a small query
    const checkConnection = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(`/api/v1/charts/hostname?host=${hostId}`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          setStatus('connected')
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }

    checkConnection()

    // Recheck every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [hostId])

  if (status === 'loading') {
    return (
      <Badge variant="outline" className="gap-1.5">
        <LoaderIcon className="size-3 animate-spin" />
        <span className="hidden sm:inline">Connecting...</span>
      </Badge>
    )
  }

  if (status === 'error') {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <CircleXIcon className="size-3" />
        <span className="hidden sm:inline">Disconnected</span>
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900">
      <CheckCircle2Icon className="size-3" />
      <span className="hidden sm:inline">Connected</span>
    </Badge>
  )
}
