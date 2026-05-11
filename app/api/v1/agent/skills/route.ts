import { getAllSkills } from '@/lib/ai/agent/skills/dynamic-loader'

export async function GET() {
  const skills = getAllSkills().map(({ name, description, source }) => ({
    name,
    description,
    source,
  }))
  return Response.json({ data: skills })
}

export async function POST() {
  return Response.json(
    { error: 'Runtime skill registration is disabled for security reasons' },
    { status: 403 }
  )
}
