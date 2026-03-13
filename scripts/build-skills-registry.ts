#!/usr/bin/env bun

/**
 * Build script: scans .agents/skills/ and generates lib/ai/agent/skills/registry.ts
 *
 * Usage: bun run scripts/build-skills-registry.ts
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

interface SkillEntry {
  name: string
  description: string
  content: string
}

function parseFrontmatter(raw: string): {
  name: string
  description: string
  body: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)/)
  if (!match) throw new Error('No frontmatter found')

  const frontmatter = match[1]
  const body = match[2].trim()

  // Simple YAML parsing for name and description
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)

  if (!nameMatch) throw new Error('Missing "name" in frontmatter')
  if (!descMatch) throw new Error('Missing "description" in frontmatter')

  return {
    name: nameMatch[1].trim(),
    description: descMatch[1].trim(),
    body,
  }
}

async function main() {
  const skillsDir = join(process.cwd(), '.agents', 'skills')
  const outputFile = join(
    process.cwd(),
    'lib',
    'ai',
    'agent',
    'skills',
    'registry.ts'
  )

  const skills: SkillEntry[] = []

  let dirNames: string[]
  try {
    const entries = await readdir(skillsDir, { withFileTypes: true })
    dirNames = entries.filter((e) => e.isDirectory()).map((e) => String(e.name))
  } catch {
    console.log('No .agents/skills/ directory found, generating empty registry')
    dirNames = []
  }

  for (const dirName of dirNames) {
    const skillFile = join(skillsDir, dirName, 'SKILL.md')
    try {
      const raw = await readFile(skillFile, 'utf-8')
      const { name, description, body } = parseFrontmatter(raw)
      skills.push({ name, description, content: body })
      console.log(`  Found skill: ${name}`)
    } catch (err) {
      console.warn(`  Skipping ${dirName}: ${err}`)
    }
  }

  // Generate registry.ts
  const escapeForTemplate = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')

  const skillEntries = skills
    .map(
      (s) => `  [
    '${s.name}',
    {
      name: '${s.name}',
      description: '${escapeForTemplate(s.description)}',
      content: \`${escapeForTemplate(s.content)}\`,
    },
  ]`
    )
    .join(',\n')

  const output = `/**
 * Auto-generated skills registry.
 * Run \`bun run build:skills\` to regenerate from .agents/skills/
 *
 * DO NOT EDIT MANUALLY
 */

import type { Skill } from './types'

export const SKILLS_REGISTRY: ReadonlyMap<string, Skill> = new Map([
${skillEntries}
])

/** Get all available skills metadata (without content) */
export function getSkillsMetadata(): ReadonlyArray<{
  name: string
  description: string
}> {
  return Array.from(SKILLS_REGISTRY.values()).map(({ name, description }) => ({
    name,
    description,
  }))
}

/** Load a skill by name, returns null if not found */
export function loadSkillContent(name: string): Skill | null {
  return SKILLS_REGISTRY.get(name) ?? null
}
`

  await writeFile(outputFile, output, 'utf-8')
  console.log(`\nGenerated ${outputFile} with ${skills.length} skill(s)`)
}

main().catch((err) => {
  console.error('Failed to build skills registry:', err)
  process.exit(1)
})
