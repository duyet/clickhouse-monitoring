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
  }
  isFullyConfigured: boolean
  requiredKeys: {
    apiKey: string
    apiBase: string
  }
}

/**
 * Handle GET requests for config status
 *
 * Note: LLM_MODEL is not required as it has a default value and can be
 * selected via UI dropdown. Only LLM_API_KEY and LLM_API_BASE are required.
 */
export async function GET() {
  const configured: ConfigStatus['configured'] = {
    apiKey: !!process.env.LLM_API_KEY,
    apiBase: !!process.env.LLM_API_BASE,
  }

  const isFullyConfigured = configured.apiKey && configured.apiBase

  const requiredKeys: ConfigStatus['requiredKeys'] = {
    apiKey: 'LLM_API_KEY',
    apiBase: 'LLM_API_BASE',
  }

  return NextResponse.json({
    configured,
    isFullyConfigured,
    requiredKeys,
  } satisfies ConfigStatus)
}
