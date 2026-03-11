/**
 * Query Analysis API Route
 *
 * POST /api/v1/agent/analyze
 *
 * Analyzes a ClickHouse query for performance issues and provides
 * optimization suggestions using the query analyzer and optimizer nodes.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Request/Response Types
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Request:
 * {
 *   query: string        // The SQL query to analyze
 *   hostId?: number      // Optional host identifier (default: 0)
 * }
 *
 * Response:
 * {
 *   insights: QueryInsights                  // Analysis results
 *   recommendations: OptimizationRecommendations  // Optimization suggestions
 * }
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { AgentState } from '@/lib/agents/state'

import { type NextRequest, NextResponse } from 'next/server'
import { queryAnalyzerNode } from '@/lib/agents/nodes/query-analyzer'
import { queryOptimizerNode } from '@/lib/agents/nodes/query-optimizer'

/**
 * POST handler for query analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      readonly query?: string
      readonly hostId?: number
    }

    if (!body.query) {
      return NextResponse.json(
        { error: { message: 'Query is required' } },
        { status: 400 }
      )
    }

    // Validate SQL before processing
    const { validateSqlQuery } = await import('@/lib/api/shared/validators/sql')
    try {
      validateSqlQuery(body.query)
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            message:
              error instanceof Error ? error.message : 'Invalid SQL query',
          },
        },
        { status: 400 }
      )
    }

    // Create a minimal agent state for analysis
    const state: AgentState = {
      userInput: `Analyze this query: ${body.query}`,
      hostId: body.hostId ?? 0,
      messages: [],
      stepCount: 0,
      startedAt: Date.now(),
      generatedQuery: {
        sql: body.query,
        explanation: 'Query to analyze',
        tables: [],
        isReadOnly: true,
        complexity: 'medium',
      },
    }

    // Run query analyzer
    const analyzerResult = await queryAnalyzerNode(state, { debug: false })
    const analyzerState = { ...state, ...analyzerResult }

    // Run query optimizer with insights from analyzer
    const optimizerResult = await queryOptimizerNode(analyzerState, {
      includeExamples: true,
      maxSuggestions: 10,
      debug: false,
    })

    // Merge results
    const finalState = { ...analyzerState, ...optimizerResult }

    return NextResponse.json({
      insights: finalState.queryInsights,
      recommendations: finalState.optimizationSuggestions,
    })
  } catch (error) {
    console.error('[Query Analysis API] Error:', error)

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to analyze query',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
