import { Button } from '@/components/ui/button'
import { getScopedLink } from '@/lib/scoped-link'
import { TextAlignBottomIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

export const Toolbar = async ({ database }: { database: string }) => (
  <Link href={await getScopedLink(`/top-usage-tables?database=${database}`)}>
    <Button
      variant="outline"
      className="flex flex-row gap-2 text-muted-foreground"
    >
      <TextAlignBottomIcon className="size-3" />
      Top usage tables
    </Button>
  </Link>
)
