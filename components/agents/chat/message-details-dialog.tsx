'use client'

import { BarChart3Icon, CopyIcon } from 'lucide-react'

import type { UIMessage } from 'ai'
import type { ReactNode } from 'react'
import type { AgentError } from '@/lib/ai/agent/errors'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getAgentMessageMetadata } from '@/lib/ai/agent/message-metadata'
import { cn, formatDuration } from '@/lib/utils'

function formatNumber(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  return new Intl.NumberFormat('en-US').format(value)
}

function formatCost(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  if (value === 0) return '$0.00'
  if (value < 0.0001) return '<$0.0001'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 6,
  }).format(value)
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  readonly label: string
  readonly value: string | number | null | undefined
  readonly mono?: boolean
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 border-b border-border/40 py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          'min-w-0 truncate text-right text-xs font-medium text-foreground',
          mono && 'font-mono tabular-nums'
        )}
      >
        {value ?? '-'}
      </span>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  readonly title: string
  readonly children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h4>
      <div className="rounded-lg bg-muted/20 px-3">{children}</div>
    </section>
  )
}

export function MessageDetailsDialog({
  message,
  responseDurationMs,
  error,
  followUpError,
}: {
  readonly message: UIMessage
  readonly responseDurationMs?: number
  readonly error?: AgentError | null
  readonly followUpError?: AgentError | null
}) {
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const metadata = getAgentMessageMetadata({
    message,
    responseDurationMs,
    error,
    followUpError,
  })
  const rawMetadata = JSON.stringify(metadata.raw, null, 2)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawMetadata)
      setCopied(true)
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
      copyTimerRef.current = setTimeout(() => {
        setCopied(false)
        copyTimerRef.current = null
      }, 2000)
    } catch {
      // Clipboard API unavailable.
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 rounded-full px-2.5 text-[11px] text-muted-foreground transition-[transform,background-color,color] hover:text-foreground active:scale-[0.96]"
        >
          <BarChart3Icon className="h-3.5 w-3.5" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[88vh] max-w-[min(94vw,46rem)] flex-col gap-0 overflow-hidden border-border/70 p-0">
        <DialogHeader className="border-b border-border/60 bg-muted/20 px-5 py-4 text-left">
          <DialogTitle className="text-base tracking-tight">
            Message details
          </DialogTitle>
          <DialogDescription className="text-left text-xs leading-5">
            Runtime metadata for this assistant response.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Badge variant="outline" className="justify-center rounded-full">
              {formatNumber(metadata.usage?.totalTokens)} tokens
            </Badge>
            <Badge variant="outline" className="justify-center rounded-full">
              {metadata.toolCallCount} tools
            </Badge>
            <Badge variant="outline" className="justify-center rounded-full">
              {responseDurationMs != null
                ? formatDuration(responseDurationMs)
                : '-'}
            </Badge>
            <Badge variant="outline" className="justify-center rounded-full">
              {formatCost(metadata.usage?.estimatedCostUsd)}
            </Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Model">
              <DetailRow
                label="Provider"
                value={metadata.usage?.provider}
                mono
              />
              <DetailRow label="Model" value={metadata.usage?.model} mono />
              <DetailRow
                label="Duration"
                value={
                  responseDurationMs != null
                    ? formatDuration(responseDurationMs)
                    : null
                }
                mono
              />
              <DetailRow label="Message ID" value={metadata.messageId} mono />
            </Section>

            <Section title="Usage">
              <DetailRow
                label="Input tokens"
                value={formatNumber(metadata.usage?.totalInputTokens)}
                mono
              />
              <DetailRow
                label="Output tokens"
                value={formatNumber(metadata.usage?.totalOutputTokens)}
                mono
              />
              <DetailRow
                label="Reasoning tokens"
                value={formatNumber(metadata.usage?.reasoningTokens)}
                mono
              />
              <DetailRow
                label="Estimated cost"
                value={formatCost(metadata.usage?.estimatedCostUsd)}
                mono
              />
            </Section>

            <Section title="Parts">
              <DetailRow label="Total parts" value={metadata.partCount} mono />
              <DetailRow label="Text" value={metadata.textPartCount} mono />
              <DetailRow label="Data" value={metadata.dataPartCount} mono />
              <DetailRow
                label="Reasoning"
                value={metadata.reasoningPartCount}
                mono
              />
            </Section>

            <Section title="Tools">
              <DetailRow
                label="Tool calls"
                value={metadata.toolCallCount}
                mono
              />
              <DetailRow
                label="Tool duration"
                value={
                  metadata.totalToolDurationMs != null
                    ? formatDuration(metadata.totalToolDurationMs)
                    : null
                }
                mono
              />
              {metadata.tools.map((tool, index) => (
                <DetailRow
                  key={tool.toolCallId ?? `${tool.name}-${index}`}
                  label={tool.name}
                  value={
                    tool.durationMs != null
                      ? formatDuration(tool.durationMs)
                      : 'called'
                  }
                  mono
                />
              ))}
            </Section>
          </div>

          {(error || followUpError) && (
            <Section title="Errors">
              {error && (
                <>
                  <DetailRow label="Answer error" value={error.message} />
                  <DetailRow label="Code" value={error.code} mono />
                  <DetailRow label="Upstream" value={error.upstreamMessage} />
                  <DetailRow label="Request ID" value={error.requestId} mono />
                </>
              )}
              {followUpError && (
                <>
                  <DetailRow
                    label="Follow-up error"
                    value={followUpError.message}
                  />
                  <DetailRow label="Code" value={followUpError.code} mono />
                </>
              )}
            </Section>
          )}

          <Section title="Raw metadata">
            <div className="-mx-3">
              <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">
                  Copyable JSON
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 gap-1.5 rounded-full px-2.5 text-xs transition-[transform,background-color] active:scale-[0.96]"
                >
                  <CopyIcon className="h-3.5 w-3.5" />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="max-h-56 overflow-auto px-3 py-2 text-[11px] leading-5 text-muted-foreground">
                {rawMetadata}
              </pre>
            </div>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
