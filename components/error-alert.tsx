'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'

interface ErrorAlertProps {
  title?: string
  message?: string | React.ReactNode | React.ReactNode[]
  query?: string
  reset?: () => void
  className?: string
}

export function ErrorAlert({
  title = 'Something went wrong!',
  message = 'Checking console for more details.',
  query,
  reset,
  className,
}: ErrorAlertProps) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!reset) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          reset()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [reset])

  const renderContent = (
    content: string | React.ReactNode | React.ReactNode[]
  ) => (
    <div className="mb-5 font-light">
      <code className="overflow-auto font-mono text-gray-500 hover:text-clip">
        {content}
      </code>
    </div>
  )

  return (
    <Alert className={className}>
      <AlertTitle className="text-lg">{title}</AlertTitle>
      <AlertDescription>
        {renderContent(message)}
        {query && renderContent(query)}
        {reset && (
          <Button variant="outline" onClick={() => reset()}>
            Try again {countdown >= 0 && `(${countdown}s)`}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
