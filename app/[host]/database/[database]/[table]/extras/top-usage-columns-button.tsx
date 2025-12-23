import { TextAlignBottomIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { Button } from '@/components/ui'
import { getScopedLink } from '@/lib/scoped-link'

export async function TopUsageColumnsButton({
  database,
  table,
}: {
  database: string
  table: string
}) {
  return (
    <Link
      href={
        await getScopedLink(`/top-usage-columns?table=${database}.${table}`)
      }
    >
      <Button
        variant="outline"
        className="text-muted-foreground flex flex-row gap-2"
        size="sm"
      >
        <TextAlignBottomIcon className="size-3" />
        Top usage columns
      </Button>
    </Link>
  )
}
