import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'

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
  /** Left accent + icon color. */
  accent: string
  iconColor: string
  badge: string
  badgeLabel: string
}

const SEVERITY: Record<InsightSeverity, SeverityStyle> = {
  critical: {
    icon: AlertTriangle,
    accent: 'before:bg-rose-500',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badge:
      'border-transparent bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    badgeLabel: 'Critical',
  },
  warning: {
    icon: TriangleAlert,
    accent: 'before:bg-amber-500',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge:
      'border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    badgeLabel: 'Warning',
  },
  info: {
    icon: Lightbulb,
    accent: 'before:bg-sky-500',
    iconColor: 'text-sky-600 dark:text-sky-400',
    badge:
      'border-transparent bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    badgeLabel: 'Tip',
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
        // left accent bar via a pseudo-element so we don't touch the base card
        'relative h-full gap-0 overflow-hidden p-4 pl-5 transition-shadow hover:shadow-md',
        'before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[""]',
        style.accent,
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn('size-4 shrink-0', style.iconColor)} />
          <Badge className={cn('text-[10px] font-medium', style.badge)}>
            {style.badgeLabel}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1.5 -mt-1.5 size-7 shrink-0 text-muted-foreground opacity-60 hover:opacity-100"
          aria-label={`Dismiss insight: ${insight.title}`}
          onClick={() => onDismiss(insight)}
        >
          <X className="size-4" />
        </Button>
      </div>

      <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground">
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
            className="h-7 gap-1 px-2 text-xs font-medium text-foreground/80 hover:text-foreground"
          >
            <Link href={actionHref}>
              {action.prompt && !action.href ? (
                <Sparkles className="size-3.5" />
              ) : null}
              {action.label}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
