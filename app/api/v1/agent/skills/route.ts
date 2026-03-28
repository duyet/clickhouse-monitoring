import {
  getAllSkills,
  registerSkill,
} from '@/lib/ai/agent/skills/dynamic-loader'

export async function GET() {
  const skills = getAllSkills().map(({ name, description, source }) => ({
    name,
    description,
    source,
  }))
  return Response.json({ data: skills })
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof b.name !== 'string' ||
    typeof b.description !== 'string' ||
    typeof b.content !== 'string'
  ) {
    return Response.json(
      { error: 'Request body must include: name (string), description (string), content (string)' },
      { status: 400 }
    )
  }

  const { name, description, content } = b as {
    name: string
    description: string
    content: string
  }

  registerSkill({ name, description, content, source: 'remote' })

  return Response.json({ data: { name, description, source: 'remote' } }, { status: 201 })
}
