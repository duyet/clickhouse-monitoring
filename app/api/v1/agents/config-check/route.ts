/**
 * LLM Configuration Check API Endpoint
 *
 * GET /api/v1/agents/config-check
 *
 * Returns which LLM configuration keys are present.
 * Used by the frontend to show setup guidance when config is missing.
 */

import { NextResponse } from 'next/server'

// This route checks server config but can be statically exported
export const dynamic = 'force-dynamic'

/**
 * Configuration keys required for the AI agent
 */
const REQUIRED_CONFIG_KEYS = {
  apiKey: 'LLM_API_KEY',
  apiBase: 'LLM_API_BASE',
  model: 'LLM_MODEL',
} as const

/**
 * GET handler - returns config status
 */
export async function GET() {
  const configured = {
    apiKey: !!process.env.LLM_API_KEY,
    apiBase: !!process.env.LLM_API_BASE,
    model: !!process.env.LLM_MODEL,
  }

  const isFullyConfigured = Object.values(configured).every(Boolean)

  return NextResponse.json({
    configured,
    isFullyConfigured,
    requiredKeys: REQUIRED_CONFIG_KEYS,
  })
}
