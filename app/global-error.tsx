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
        <div className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <div className="text-primary mx-auto h-12 w-12" />
            <h1 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Oops, something went wrong!
            </h1>
            <p className="text-muted-foreground mt-4">
              We&apos;re sorry, but an unexpected error has occurred. Please try
              again later or contact support if the issue persists.
            </p>
            <div className="mt-6">
              <button
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-xs transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
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
