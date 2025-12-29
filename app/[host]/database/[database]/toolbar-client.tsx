'use client'

import { TextAlignBottomIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useHostId } from '@/lib/swr/use-host'

export function Toolbar({ database }: { database: string }) {
  const hostId = useHostId()

  return (
    <Link href={`/${hostId}/top-usage-tables?database=${database}`}>
      <Button
        variant="outline"
        className="text-muted-foreground flex flex-row gap-2"
      >
        <TextAlignBottomIcon className="size-3" />
        Top usage tables
      </Button>
    </Link>
  )
}
