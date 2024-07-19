'use client'

import '@/app/globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className={inter.className}>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Oops, something went wrong!
            </h1>
            <p className="mt-4 text-muted-foreground">
              We&apos;re sorry, but an unexpected error has occurred. Please try
              again later or contact support if the issue persists.
            </p>
            <div className="mt-6">
              <button
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => reset()}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
