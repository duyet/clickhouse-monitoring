'use client'

import { useEffect } from 'react'

import { ErrorAlert } from '@/components/error-alert'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <ErrorAlert
      title="Something went wrong"
      message={error.message}
      reset={reset}
    />
  )
}
