import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatQuery } from '@/lib/format-readable'
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { SizeIcon } from '@radix-ui/react-icons'

export type CodeDialogOptions = {
  dialog_title?: string
  dialog_description?: string
  max_truncate?: number
  hide_query_comment?: boolean
}

interface CodeDialogFormatProps {
  row: any
  value: any
  options?: CodeDialogOptions
}

const CODE_TRUNCATE_LENGTH = 50

export function CodeDialogFormat({ value, options }: CodeDialogFormatProps) {
  const truncate_length = options?.max_truncate || CODE_TRUNCATE_LENGTH

  if (value.length < truncate_length) {
    return <code>{value}</code>
  }

  let code = formatQuery({
    query: value,
    comment_remove: options?.hide_query_comment,
    truncate: truncate_length,
  })

  return (
    <Dialog>
      <DialogTrigger className="flex flex-row items-center gap-1">
        <code className="truncate break-words font-normal">{code}</code>
        <SizeIcon className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-fit">
        {(options?.dialog_title || options?.dialog_description) && (
          <DialogHeader>
            <DialogTitle>{options.dialog_title}</DialogTitle>
            <DialogDescription>{options.dialog_description}</DialogDescription>
          </DialogHeader>
        )}

        <div>
          <code className="whitespace-pre-wrap font-normal text-stone-500">
            {value}
          </code>
        </div>
      </DialogContent>
    </Dialog>
  )
}
