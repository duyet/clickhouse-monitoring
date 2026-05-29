'use client'

import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

interface HealthAuditPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  prompt: string
}

export function HealthAuditPromptDialog({
  open,
  onOpenChange,
  title,
  prompt,
}: HealthAuditPromptDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      toast.success('Audit prompt copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy prompt')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Audit prompt: {title}</DialogTitle>
          <DialogDescription>
            Copy and paste this prompt into any AI/coding agent (Claude,
            ChatGPT, etc.) to get a tailored diagnosis and remediation plan.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[420px] rounded-md border">
          <Textarea
            readOnly
            value={prompt}
            className="min-h-[420px] resize-none border-0 font-mono text-xs leading-relaxed focus-visible:ring-0"
          />
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <Check className="mr-2 size-4" />
            ) : (
              <Copy className="mr-2 size-4" />
            )}
            {copied ? 'Copied' : 'Copy prompt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
