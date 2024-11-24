import { TextAlignBottomIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
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
      href={await getScopedLink(
        `/top-usage-columns?table=${database}.${table}`
      )}
    >
      <Button
        variant="outline"
        className="flex flex-row gap-2 text-muted-foreground"
        size="sm"
      >
        <TextAlignBottomIcon className="size-3" />
        Top usage columns
      </Button>
    </Link>
  )
}
