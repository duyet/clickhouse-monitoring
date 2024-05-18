import React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorAlertProps {
  title?: string
  message?: string | React.ReactNode | React.ReactNode[]
  reset?: () => void
  className?: string
}

export function ErrorAlert({
  title = 'Something went wrong!',
  message = 'Checking console for more details.',
  reset,
  className,
}: ErrorAlertProps) {
  return (
    <Alert className={className}>
      <AlertTitle className="text-lg">{title}</AlertTitle>
      <AlertDescription>
        <div className="mb-5 font-light">
          <code className="overflow-auto hover:text-clip">
            {message}
          </code>
        </div>

        {reset ? (
          <Button
            variant="outline"
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
          >
            Try again
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
