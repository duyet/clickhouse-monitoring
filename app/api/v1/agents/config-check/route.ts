/**
 * Agent LLM Config Check Endpoint
 *
 * GET /api/v1/agents/config-check
 *
 * Returns the status of LLM configuration for the AI agent.
 * Used by the frontend to determine if the agent is properly configured
 * and which environment variables are missing.
 */

import { NextResponse } from 'next/server'

interface ConfigStatus {
  configured: {
    apiKey: boolean
    apiBase: boolean
    model: boolean
  }
  isFullyConfigured: boolean
  requiredKeys: {
    apiKey: string
    apiBase: string
    model: string
  }
}

/**
 * Handle GET requests for config status
 */
export async function GET() {
  const configured: ConfigStatus['configured'] = {
    apiKey: !!process.env.LLM_API_KEY,
    apiBase: !!process.env.LLM_API_BASE,
    model: !!process.env.LLM_MODEL,
  }

  const isFullyConfigured =
    configured.apiKey && configured.apiBase && configured.model

  const requiredKeys: ConfigStatus['requiredKeys'] = {
    apiKey: 'LLM_API_KEY',
    apiBase: 'LLM_API_BASE',
    model: 'LLM_MODEL',
  }

  return NextResponse.json({
    configured,
    isFullyConfigured,
    requiredKeys,
  } satisfies ConfigStatus)
}
