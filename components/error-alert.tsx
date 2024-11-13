'use client'

import dedent from 'dedent'
import React, { useEffect, useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { NotebookPenIcon } from 'lucide-react'

interface ErrorAlertProps {
  title?: string
  message?: string | React.ReactNode | React.ReactNode[]
  docs?: string | React.ReactNode | React.ReactNode[]
  query?: string
  reset?: () => void
  className?: string
}

export function ErrorAlert({
  title = 'Something went wrong!',
  message = 'Checking console for more details.',
  docs,
  query,
  reset,
  className,
}: ErrorAlertProps) {
  const [countdown, setCountdown] = useState(30)

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

  const renderAccordion = (
    title: string,
    content: string | React.ReactNode
  ) => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem className="border-none" value="item-1">
        <AccordionTrigger role="open-query">{title}</AccordionTrigger>
        <AccordionContent>
          <code className="text-wrap text-muted-foreground">
            {typeof content === 'string' ? (
              <pre>{dedent(content)}</pre>
            ) : (
              content
            )}
          </code>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )

  const renderDocs = (docs: string | React.ReactNode) => (
    <>
      {docs ? (
        <div className="flex items-center gap-2">
          <NotebookPenIcon className="w-4 flex-none" />
          {docs}
        </div>
      ) : null}
    </>
  )

  return (
    <Alert className={className}>
      <AlertTitle className="text-lg">{title}</AlertTitle>
      <AlertDescription>
        {renderContent(message)}
        {Boolean(query) && renderAccordion('View Full Query Details', query)}
        {Boolean(docs) && renderDocs(docs)}
        {reset && (
          <Button variant="outline" onClick={() => reset()}>
            Try again {countdown >= 0 && `(${countdown}s)`}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
