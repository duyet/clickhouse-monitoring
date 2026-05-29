import { getAllSkills } from '@/lib/ai/agent/skills/dynamic-loader'
import { authorizeAgentApiRequest } from '@/lib/auth/agent-api-auth'

export async function GET(request: Request) {
  const authResponse = await authorizeAgentApiRequest(request)
  if (authResponse) return authResponse

  const skills = getAllSkills().map(({ name, description, source }) => ({
    name,
    description,
    source,
  }))
  return Response.json({ data: skills })
}

export async function POST(request: Request) {
  const authResponse = await authorizeAgentApiRequest(request)
  if (authResponse) return authResponse

  return Response.json(
    { error: 'Runtime skill registration is disabled for security reasons' },
    { status: 403 }
  )
}
