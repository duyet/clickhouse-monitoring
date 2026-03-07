import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { SizeIcon } from '@radix-ui/react-icons'
import { ExternalLinkIcon } from 'lucide-react'

import dedent from 'dedent'
import Link from 'next/link'
import { memo, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog'
import { buildExplorerQueryUrl } from '@/lib/explorer-url'
import { formatQuery } from '@/lib/format-readable'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

export interface CodeDialogOptions {
  dialog_title?: string
  dialog_description?: string
  trigger_classname?: string
  max_truncate?: number
  hide_query_comment?: boolean
  json?: boolean
  dialog_classname?: string
  show_explorer_link?: boolean
}

function ExplorerLink({ query }: { query: string }) {
  const hostId = useHostId()
  const href = buildExplorerQueryUrl(query, hostId)
  return (
    <Button variant="ghost" size="icon" className="size-7" asChild>
      <Link href={href} title="Open in Explorer">
        <ExternalLinkIcon className="size-3.5" />
      </Link>
    </Button>
  )
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

  if (formatted.length < truncate_length) {
    return <code className="whitespace-nowrap">{formatted}</code>
  }

  // If the code is not truncated, show the full code
  if (!formatted.endsWith('...')) {
    return <code className="whitespace-nowrap">{formatted}</code>
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            'flex max-w-fit cursor-pointer flex-row items-center gap-1 line-clamp-1',
            options?.trigger_classname
          )}
        >
          <code className="font-normal whitespace-nowrap truncated">
            {formatted}
          </code>
          <SizeIcon className="size-4 flex-none" />
        </div>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'max-w-[95vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] min-w-80',
          options?.dialog_classname
        )}
        aria-describedby={options?.dialog_description}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{options?.dialog_title}</DialogTitle>
            {(options?.show_explorer_link ||
              options?.dialog_title === 'Running Query') && (
              <ExplorerLink query={value} />
            )}
          </div>
          <DialogDescription>{options?.dialog_description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-auto">
          <code className="text-sm text-wrap whitespace-pre-wrap">
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
