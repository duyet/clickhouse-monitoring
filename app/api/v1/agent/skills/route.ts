import { getSkillsMetadata } from '@/lib/ai/agent/skills/registry'

export async function GET() {
  const skills = getSkillsMetadata()
  return Response.json({ data: skills })
}
