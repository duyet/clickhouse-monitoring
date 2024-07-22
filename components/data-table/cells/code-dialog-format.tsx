import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatQuery } from '@/lib/format-readable'
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { SizeIcon } from '@radix-ui/react-icons'

export interface CodeDialogOptions {
  dialog_title?: string
  dialog_description?: string
  max_truncate?: number
  hide_query_comment?: boolean
  json?: boolean
}

interface CodeDialogFormatProps {
  value: any
  options?: CodeDialogOptions
}

const CODE_TRUNCATE_LENGTH = 50

export function CodeDialogFormat({ value, options }: CodeDialogFormatProps) {
  const truncate_length = options?.max_truncate || CODE_TRUNCATE_LENGTH

  let formatted = formatQuery({
    query: value,
    comment_remove: options?.hide_query_comment,
    truncate: truncate_length,
  })

  if (formatted.length < truncate_length) {
    return <code>{formatted}</code>
  }

  // If the code is not truncated, show the full code
  if (!formatted.endsWith('...')) {
    return <code>{formatted}</code>
  }

  let content = value
  if (options?.json) {
    let json = content
    try {
      json = JSON.parse(value)
    } catch {}
    try {
      content = JSON.stringify(json, null, 2)
    } catch {}
  }

  return (
    <Dialog>
      <DialogTrigger className="flex flex-row items-center gap-1">
        <code className="truncate break-words font-normal" role="shorten-code">
          {formatted}
        </code>
        <SizeIcon className="size-4" role="open-dialog" />
      </DialogTrigger>
      <DialogContent className="max-w-fit">
        {(options?.dialog_title || options?.dialog_description) && (
          <DialogHeader>
            <DialogTitle>{options.dialog_title}</DialogTitle>
            <DialogDescription>{options.dialog_description}</DialogDescription>
          </DialogHeader>
        )}

        <div>
          <code className="whitespace-pre-wrap text-sm text-stone-500">
            {content}
          </code>
        </div>
      </DialogContent>
    </Dialog>
  )
}
