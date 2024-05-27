import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import React from 'react'

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
  const renderContent = (
    content: string | React.ReactNode | React.ReactNode[]
  ) => (
    <div className="mb-5 font-light">
      <code className="overflow-auto hover:text-clip">{content}</code>
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
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
