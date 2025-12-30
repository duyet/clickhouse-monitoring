import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { SizeIcon } from '@radix-ui/react-icons'
import dedent from 'dedent'
import { memo, useMemo } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatQuery } from '@/lib/format-readable'
import { cn } from '@/lib/utils'

export interface CodeDialogOptions {
  dialog_title?: string
  dialog_description?: string
  trigger_classname?: string
  max_truncate?: number
  hide_query_comment?: boolean
  json?: boolean
  dialog_classname?: string
}

interface CodeDialogFormatProps {
  value: string
  options?: CodeDialogOptions
}

const CODE_TRUNCATE_LENGTH = 50

export const CodeDialogFormat = memo(function CodeDialogFormat({
  value,
  options,
}: CodeDialogFormatProps): React.ReactNode {
  const truncate_length = options?.max_truncate || CODE_TRUNCATE_LENGTH

  // Memoize query formatting
  const formatted = useMemo(() => {
    return formatQuery({
      query: value,
      comment_remove: options?.hide_query_comment,
      truncate: truncate_length,
    })
  }, [value, options?.hide_query_comment, truncate_length])

  if (formatted.length < truncate_length) {
    return <code>{formatted}</code>
  }

  // If the code is not truncated, show the full code
  if (!formatted.endsWith('...')) {
    return <code>{formatted}</code>
  }

  // Memoize JSON processing for dialog content
  const content = useMemo(() => {
    let result = value
    if (options?.json) {
      let json = result
      try {
        json = JSON.parse(value)
      } catch {}
      try {
        result = JSON.stringify(json, null, 2)
      } catch {}
    }
    return result
  }, [value, options?.json])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            'flex max-w-fit cursor-pointer flex-row items-center gap-1'
          )}
        >
          <code
            className={cn(
              'font-normal break-words',
              options?.trigger_classname
            )}
          >
            {formatted}
          </code>
          <SizeIcon className="size-4 flex-none" />
        </div>
      </DialogTrigger>
      <DialogContent
        className={cn('max-w-fit', options?.dialog_classname)}
        aria-describedby={options?.dialog_description}
      >
        <DialogHeader>
          <DialogTitle>{options?.dialog_title}</DialogTitle>
          <DialogDescription>{options?.dialog_description}</DialogDescription>
        </DialogHeader>

        <div>
          <code className="text-sm text-wrap whitespace-pre-wrap text-stone-500">
            {typeof content === 'string' ? (
              <pre className="text-wrap whitespace-pre-wrap">
                {dedent(content)}
              </pre>
            ) : (
              content
            )}
          </code>
        </div>
      </DialogContent>
    </Dialog>
  )
})
