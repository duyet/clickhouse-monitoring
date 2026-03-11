/**
 * Query Insights Panel Component
 *
 * A React component for displaying AI-powered query analysis and optimization
 * suggestions. Integrates with the slow queries page to provide actionable insights.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Component Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * QueryInsightsPanel
 * ├── Header (query summary, health score, analyze button)
 * ├── HealthIndicator (visual health score with color coding)
 * ├── IssuesList (detected performance issues)
 * ├── SuggestionsList (optimization recommendations)
 * └── ExampleCode (before/after query comparisons)
 *
 * Data Flow:
 * 1. User clicks "Analyze with AI" on slow queries page
 * 2. Component calls API with query SQL
 * 3. API returns insights and suggestions
 * 4. Component displays actionable recommendations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  InfoIcon,
  LightbulbIcon,
  Loader2Icon,
  XIcon,
} from 'lucide-react'

import type {
  QueryInsights,
  QueryIssue,
} from '@/lib/agents/nodes/query-analyzer'
import type {
  OptimizationRecommendations,
  OptimizationSuggestion,
} from '@/lib/agents/nodes/query-optimizer'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Props for QueryInsightsPanel
 */
interface QueryInsightsPanelProps {
  /** The SQL query to analyze */
  readonly query: string
  /** Optional pre-fetched insights */
  readonly initialInsights?: QueryInsights
  /** Optional pre-fetched recommendations */
  readonly initialRecommendations?: OptimizationRecommendations
  /** Optional CSS class name */
  readonly className?: string
  /** Callback when analysis is complete */
  readonly onAnalysisComplete?: (insights: QueryInsights) => void
  /** Whether to show the panel expanded by default */
  readonly defaultExpanded?: boolean
}

/**
 * Severity badge component
 */
function SeverityBadge({
  severity,
}: {
  readonly severity: QueryIssue['severity']
}) {
  const config = {
    critical: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      label: 'Critical',
    },
    high: {
      color:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      label: 'High',
    },
    medium: {
      color:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      label: 'Medium',
    },
    low: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      label: 'Low',
    },
    info: {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      label: 'Info',
    },
  }[severity]

  return (
    <Badge className={cn(config.color, 'font-medium')}>{config.label}</Badge>
  )
}

/**
 * Health score indicator component
 */
function HealthScoreIndicator({ score }: { readonly score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2Icon className="h-5 w-5" />
    if (score >= 60) return <AlertTriangleIcon className="h-5 w-5" />
    return <AlertTriangleIcon className="h-5 w-5" />
  }

  const getLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex items-center gap-1', getColor(score))}>
        {getIcon(score)}
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-sm">/100</span>
      </div>
      <span className={cn('text-sm font-medium', getColor(score))}>
        {getLabel(score)}
      </span>
    </div>
  )
}

/**
 * Issue item component
 */
function IssueItem({ issue }: { readonly issue: QueryIssue }) {
  const [expanded, setExpanded] = useState(false)

  const getIcon = (severity: QueryIssue['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return (
          <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
        )
      case 'medium':
        return (
          <AlertTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        )
      default:
        return <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    }
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
        <div className="mt-0.5">{getIcon(issue.severity)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-sm font-medium text-left hover:underline">
                {expanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
                {issue.type
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            </CollapsibleTrigger>
            <SeverityBadge severity={issue.severity} />
          </div>
          <p className="text-sm text-muted-foreground">{issue.description}</p>
          <CollapsibleContent className="mt-2 text-sm space-y-2">
            {issue.location && (
              <div className="p-2 bg-muted rounded text-xs font-mono">
                {issue.location.excerpt}
              </div>
            )}
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
              <span className="font-medium">Suggestion:</span>{' '}
              {issue.suggestion}
            </div>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  )
}

/**
 * Suggestion item component
 */
function SuggestionItem({
  suggestion,
}: {
  readonly suggestion: OptimizationSuggestion
}) {
  const [showExample, setShowExample] = useState(false)

  const getPriorityColor = (priority: OptimizationSuggestion['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 dark:text-red-400'
      case 'high':
        return 'text-orange-600 dark:text-orange-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  const getDifficultyBadge = (
    difficulty: OptimizationSuggestion['difficulty']
  ) => {
    const config = {
      easy: {
        color:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        label: 'Easy',
      },
      moderate: {
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        label: 'Moderate',
      },
      complex: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        label: 'Complex',
      },
    }[difficulty]

    return <Badge className={cn(config.color, 'text-xs')}>{config.label}</Badge>
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <LightbulbIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className="text-sm font-medium">{suggestion.title}</h4>
          {getDifficultyBadge(suggestion.difficulty)}
          <span
            className={cn(
              'text-xs font-medium',
              getPriorityColor(suggestion.priority)
            )}
          >
            {suggestion.priority}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {suggestion.description}
        </p>

        {/* Expected impact */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>Expected impact:</span>
          <span className="font-medium capitalize">
            {suggestion.expectedImpact.improvement}{' '}
            {suggestion.expectedImpact.metric}
          </span>
          {suggestion.expectedImpact.estimatedPercent && (
            <span className="text-green-600 dark:text-green-400">
              (~{suggestion.expectedImpact.estimatedPercent}%)
            </span>
          )}
        </div>

        {/* Code example */}
        {suggestion.example && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExample(!showExample)}
              className="h-7 text-xs px-2"
            >
              {showExample ? 'Hide' : 'Show'} Example
            </Button>
            {showExample && (
              <div className="mt-2 space-y-2">
                <div>
                  <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                    Before:
                  </div>
                  <pre className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs overflow-x-auto">
                    <code>{suggestion.example.before}</code>
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                    After:
                  </div>
                  <pre className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs overflow-x-auto">
                    <code>{suggestion.example.after}</code>
                  </pre>
                </div>
                {suggestion.example.explanation && (
                  <div className="text-xs text-muted-foreground italic">
                    {suggestion.example.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Documentation link */}
        {suggestion.docLink && (
          <a
            href={suggestion.docLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
          >
            Learn more →
          </a>
        )}
      </div>
    </div>
  )
}

/**
 * Loading skeleton for insights panel
 */
function QueryInsightsSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Main Query Insights Panel component
 */
export function QueryInsightsPanel({
  query,
  initialInsights,
  initialRecommendations,
  className,
  onAnalysisComplete,
  defaultExpanded = false,
}: QueryInsightsPanelProps) {
  const [insights, setInsights] = useState<QueryInsights | undefined>(
    initialInsights
  )
  const [recommendations, setRecommendations] = useState<
    OptimizationRecommendations | undefined
  >(initialRecommendations)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(defaultExpanded)

  const analyzeQuery = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the agent API to analyze the query
      const response = await fetch('/api/v1/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: { readonly message?: string }
        }
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }

      const data = (await response.json()) as {
        insights?: QueryInsights
        recommendations?: OptimizationRecommendations
      }

      if (data.insights) {
        setInsights(data.insights)
        onAnalysisComplete?.(data.insights)
      }

      if (data.recommendations) {
        setRecommendations(data.recommendations)
      }

      setExpanded(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <QueryInsightsSkeleton />
  }

  if (!insights && !recommendations) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LightbulbIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="font-medium">AI Query Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Get optimization suggestions for this query
              </p>
            </div>
          </div>
          <Button onClick={analyzeQuery} disabled={isLoading} size="sm">
            {isLoading ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <LightbulbIcon className="h-4 w-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </Card>
    )
  }

  const hasQuickWins =
    recommendations?.quickWins && recommendations.quickWins.length > 0

  return (
    <Card className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <LightbulbIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h3 className="font-medium">Query Insights</h3>
            {insights && <HealthScoreIndicator score={insights.healthScore} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={analyzeQuery}
            disabled={isLoading}
          >
            <Loader2Icon
              className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')}
            />
            Re-analyze
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick wins summary */}
      {hasQuickWins && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="font-medium text-sm">Quick Wins Available</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {recommendations.quickWins.length} easy fixes that can significantly
            improve performance
          </p>
          <div className="flex flex-wrap gap-1">
            {recommendations.quickWins.slice(0, 3).map((win) => (
              <Badge key={win.id} variant="secondary" className="text-xs">
                {win.title}
              </Badge>
            ))}
            {recommendations.quickWins.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{recommendations.quickWins.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Estimated improvement */}
      {recommendations && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Estimated improvement:</span>{' '}
            <span className="text-green-600 dark:text-green-400 font-medium">
              {recommendations.estimatedImprovement.latency}% latency
            </span>
            {' · '}
            <span className="text-green-600 dark:text-green-400 font-medium">
              {recommendations.estimatedImprovement.memory}% memory
            </span>
          </div>
        </div>
      )}

      {/* Collapsible content */}
      {expanded && (
        <div className="space-y-4">
          {/* Issues */}
          {insights && insights.issues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Issues Detected ({insights.issues.length})
              </h4>
              <div className="space-y-2">
                {insights.issues.map((issue) => (
                  <IssueItem key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && recommendations.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <LightbulbIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                Optimization Suggestions ({recommendations.suggestions.length})
              </h4>
              <div className="space-y-2">
                {recommendations.suggestions.map((suggestion) => (
                  <SuggestionItem key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
            </div>
          )}

          {/* Query details */}
          {insights && (
            <div>
              <h4 className="text-sm font-medium mb-2">Query Details</h4>
              <div className="p-3 bg-muted rounded text-xs space-y-1">
                <div>
                  <span className="font-medium">Type:</span>{' '}
                  <span className="capitalize">{insights.queryType}</span>
                </div>
                <div>
                  <span className="font-medium">Tables:</span>{' '}
                  {insights.tables.length > 0
                    ? insights.tables.join(', ')
                    : 'None detected'}
                </div>
                <div>
                  <span className="font-medium">Resource estimate:</span>{' '}
                  <span className="capitalize">
                    CPU: {insights.resourceEstimate.cpu}
                  </span>
                  {' · '}
                  <span className="capitalize">
                    Memory: {insights.resourceEstimate.memory}
                  </span>
                  {' · '}
                  <span className="capitalize">
                    Disk: {insights.resourceEstimate.disk}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </Card>
  )
}

/**
 * Standalone panel for integration with slow queries page
 */
export function QueryInsightsPanelWithTrigger({
  query,
  className,
}: {
  readonly query: string
  readonly className?: string
}) {
  const [showPanel, setShowPanel] = useState(false)

  return (
    <div className={className}>
      {!showPanel ? (
        <Button variant="outline" size="sm" onClick={() => setShowPanel(true)}>
          <LightbulbIcon className="h-4 w-4 mr-2" />
          Analyze with AI
        </Button>
      ) : (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPanel(false)}
            className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 rounded-full"
          >
            <XIcon className="h-3 w-3" />
          </Button>
          <QueryInsightsPanel query={query} defaultExpanded />
        </div>
      )}
    </div>
  )
}
