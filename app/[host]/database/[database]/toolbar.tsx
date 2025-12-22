import { TextAlignBottomIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { Button } from '@/components/ui'
import { getScopedLink } from '@/lib/scoped-link'

export const Toolbar = async ({ database }: { database: string }) => (
  <Link href={await getScopedLink(`/top-usage-tables?database=${database}`)}>
    <Button
      variant="outline"
      className="text-muted-foreground flex flex-row gap-2"
    >
      <TextAlignBottomIcon className="size-3" />
      Top usage tables
    </Button>
  </Link>
)
