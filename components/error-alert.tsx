import React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorAlertProps {
  title?: string
  message?: string | React.ReactNode | React.ReactNode[]
  reset?: () => void
}

export function ErrorAlert({
  title = 'Something went wrong!',
  message = 'Checking console for more details.',
  reset,
}: ErrorAlertProps) {
  return (
    <Alert>
      <AlertTitle className="text-lg">{title}</AlertTitle>
      <AlertDescription>
        <div className="mb-5 font-light">
          <pre>
            <code>{message}</code>
          </pre>
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
