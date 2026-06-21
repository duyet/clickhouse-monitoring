import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, ArrowRight, Info, TriangleAlert, X } from 'lucide-react'

import type {
  InsightCard as InsightCardData,
  InsightSeverity,
} from '@/lib/insights/types'

import { AppLink as Link } from '@/components/ui/app-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { buildUrl } from '@/lib/url/url-builder'
import { cn } from '@/lib/utils'

interface SeverityStyle {
  icon: LucideIcon
  /** Thin left border color (pseudo-element). */
  accent: string
  iconColor: string
  badge: string
  badgeLabel: string
}

const SEVERITY: Record<InsightSeverity, SeverityStyle> = {
  critical: {
    icon: AlertTriangle,
    accent: 'before:bg-rose-500/70',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badge:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400',
    badgeLabel: 'Critical',
  },
  warning: {
    icon: TriangleAlert,
    accent: 'before:bg-amber-400/70',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400',
    badgeLabel: 'Warning',
  },
  info: {
    icon: Info,
    accent: 'before:bg-border',
    iconColor: 'text-muted-foreground',
    badge:
      'border-border bg-muted/50 text-muted-foreground dark:bg-muted/30 dark:text-muted-foreground',
    badgeLabel: 'Info',
  },
}

interface InsightCardProps {
  insight: InsightCardData
  hostId: number
  onDismiss: (insight: InsightCardData) => void
  className?: string
}

export function InsightCard({
  insight,
  hostId,
  onDismiss,
  className,
}: InsightCardProps) {
  const style = SEVERITY[insight.severity]
  const Icon = style.icon

  const action = insight.action
  const actionHref = action?.href
    ? buildUrl(action.href, { host: hostId })
    : action?.prompt
      ? buildUrl('/agents', { host: hostId })
      : undefined

  return (
    <Card
      className={cn(
        // thin left border via pseudo-element — never touches components/ui/card
        'relative h-full gap-0 overflow-hidden p-4 pl-[13px] transition-colors',
        'before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:content-[""]',
        style.accent,
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon className={cn('size-3.5 shrink-0', style.iconColor)} />
          <Badge
            variant="outline"
            className={cn('text-[10px] font-medium', style.badge)}
          >
            {style.badgeLabel}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1.5 -mt-1.5 size-7 shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
          aria-label={`Dismiss insight: ${insight.title}`}
          onClick={() => onDismiss(insight)}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <h3 className="mt-2 text-sm font-medium leading-snug text-foreground">
        {insight.title}
      </h3>
      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
        {insight.detail}
      </p>

      {action && actionHref ? (
        <div className="mt-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-0 text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            <Link href={actionHref}>
              {action.label}
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
