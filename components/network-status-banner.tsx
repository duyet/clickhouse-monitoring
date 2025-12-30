'use client'

import { memo, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type NetworkStatus = 'online' | 'offline' | 'checking'

/**
 * Network status banner that shows when the user goes offline
 * Automatically detects network changes and displays helpful information
 */
export const NetworkStatusBanner = memo(function NetworkStatusBanner() {
  const [status, setStatus] = useState<NetworkStatus>('checking')
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Initial check
    const updateStatus = () => {
      const isOnline = navigator.onLine
      setStatus(isOnline ? 'online' : 'offline')
      if (isOnline && wasOffline) {
        setWasOffline(false)
        // Trigger a page reload when coming back online
        window.location.reload()
      }
    }

    updateStatus()

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus('online')
      setWasOffline(true)
    }

    const handleOffline = () => {
      setStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  // Only show banner when offline
  if (status === 'online' || status === 'checking') {
    return null
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-[100] w-full border-b',
        'bg-amber-50 border-amber-200 text-amber-900',
        'dark:bg-amber-950 dark:border-amber-900 dark:text-amber-50'
      )}
    >
      <div className="container mx-auto px-3 md:px-4 lg:px-6 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 bg-amber-100 border-amber-300 dark:bg-amber-900 dark:border-amber-800"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-amber-600" />
              </span>
              <span className="text-xs font-medium">Offline</span>
            </Badge>
            <span className="text-sm">
              You appear to be offline. Some features may not work correctly.
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  )
})
