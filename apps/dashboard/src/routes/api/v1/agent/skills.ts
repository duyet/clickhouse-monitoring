/**
 * Agent skills listing endpoint.
 *
 * GET  /api/v1/agent/skills  — list available agent skills.
 * POST /api/v1/agent/skills  — runtime skill registration is disabled (403).
 *
 * Ported from apps/dashboard/app/api/v1/agent/skills/route.ts.
 * - Already uses plain Response.json (no next/server) — only the createFileRoute
 *   wrapper is added.
 */

import { createFileRoute } from '@tanstack/react-router'

import { getAllSkills } from '@/lib/ai/agent/skills/dynamic-loader'
import { authorizeAgentApiRequest } from '@/lib/auth/agent-api-auth'

async function handleGet(request: Request): Promise<Response> {
  const authResponse = await authorizeAgentApiRequest(request)
  if (authResponse) return authResponse

  const skills = getAllSkills().map(({ name, description, source }) => ({
    name,
    description,
    source,
  }))
  return Response.json({ data: skills })
}

async function handlePost(request: Request): Promise<Response> {
  const authResponse = await authorizeAgentApiRequest(request)
  if (authResponse) return authResponse

  return Response.json(
    { error: 'Runtime skill registration is disabled for security reasons' },
    { status: 403 }
  )
}

export const Route = createFileRoute('/api/v1/agent/skills')({
  server: {
    handlers: {
      GET: async ({ request }) => handleGet(request),
      POST: async ({ request }) => handlePost(request),
    },
  },
})
