'use client'

import dedent from 'dedent'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui'
import { BugIcon, DatabaseIcon, NotebookPenIcon } from 'lucide-react'
import type React from 'react'

import { shouldShowDetailedErrors } from '@/lib/env-utils'

import { renderContent, truncateMessage } from './error-utils'

interface ErrorContentProps {
  message?: string | React.ReactNode | React.ReactNode[]
  docs?: string | React.ReactNode | React.ReactNode[]
  query?: string
  digest?: string
  stack?: string
  compact?: boolean
}

const AccordionSection = ({
  title,
  content,
}: {
  title: string
  content: string | React.ReactNode
}) => (
  <div className="mt-3">
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem className="border-0" value="item-1">
        <AccordionTrigger className="px-0 py-2 text-sm hover:no-underline">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="h-4 w-4" />
            {title}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-0 pb-0">
          <div className="bg-muted/30 rounded p-2">
            <code className="text-muted-foreground text-xs">
              {typeof content === 'string' ? (
                <pre className="whitespace-pre-wrap">{dedent(content)}</pre>
              ) : (
                content
              )}
            </code>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
)

const DocsSection = ({ docs }: { docs: string | React.ReactNode }) =>
  docs ? (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-start gap-2">
        <NotebookPenIcon className="text-muted-foreground mt-0.5 h-4 w-4 flex-none" />
        <div className="text-muted-foreground text-sm">{docs}</div>
      </div>
    </div>
  ) : null

const DigestSection = ({ digest }: { digest: string }) => (
  <div className="mt-3 border-t pt-3">
    <div className="flex items-start gap-2">
      <BugIcon className="text-muted-foreground mt-0.5 h-4 w-4 flex-none" />
      <div className="text-muted-foreground text-xs">
        <div className="font-medium">Error ID (for support):</div>
        <code className="bg-muted/30 mt-1 block rounded px-2 py-1 font-mono">
          {digest}
        </code>
      </div>
    </div>
  </div>
)

const CompactMessage = ({
  message,
}: {
  message: string | React.ReactNode
}) => (
  <div className="text-muted-foreground text-xs">
    {typeof message === 'string'
      ? truncateMessage(message)
      : message}
  </div>
)

export function ErrorContent({
  message,
  docs,
  query,
  digest,
  stack,
  compact = false,
}: ErrorContentProps) {
  const showDetails = shouldShowDetailedErrors()
  const compactMessage =
    compact && typeof message === 'string' ? message.split('\n')[0] : message

  return (
    <div className="flex-1 space-y-2">
      {message && !compact && renderContent(compactMessage)}
      {message && compact && <CompactMessage message={compactMessage} />}

      {!compact && showDetails && stack && (
        <AccordionSection title="Stack Trace" content={stack} />
      )}
      {Boolean(query) && (
        <AccordionSection title="View Query Details" content={query} />
      )}
      {!compact && Boolean(docs) && <DocsSection docs={docs} />}
      {!compact && digest && <DigestSection digest={digest} />}
    </div>
  )
}
