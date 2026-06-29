#!/usr/bin/env bun

/**
 * Prepare a dashboard Wrangler config for deploy.
 *
 * Conversation D1 storage is optional and disabled by default. Wrangler D1
 * bindings still need a concrete database_id at deploy time, so an active
 * CHM_CLOUD_D1 block without a UUID makes preview/prod deploys hit the D1
 * control plane even when the feature is off. This writes a deploy-only config
 * that either injects CHM_CLOUD_D1_DATABASE_ID or drops the unprovisioned
 * optional binding.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_OUTPUT = '.wrangler.deploy.toml'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Args {
  config: string
  output: string
}

interface PrepareResult {
  content: string
  injected: number
  removed: number
  foundConversationD1: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    config: join(process.cwd(), 'wrangler.toml'),
    output: join(process.cwd(), DEFAULT_OUTPUT),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--config') {
      args.config = argv[index + 1] ?? args.config
      index += 1
    } else if (arg === '--output') {
      args.output = argv[index + 1] ?? args.output
      index += 1
    }
  }

  return args
}

function conversationD1DatabaseId(): string | null {
  const value =
    process.env.CHM_CLOUD_D1_DATABASE_ID ??
    process.env.AGENT_CHM_CLOUD_D1_DATABASE_ID ??
    ''
  const trimmed = value.trim()
  if (!trimmed) return null

  if (!UUID_RE.test(trimmed)) {
    throw new Error(
      'CHM_CLOUD_D1_DATABASE_ID must be a Cloudflare D1 database UUID.'
    )
  }

  return trimmed
}

function hasExplicitD1Store(): boolean {
  return (
    process.env.AGENT_CONVERSATION_PERSISTENCE === 'true' &&
    process.env.AGENT_CONVERSATION_STORE === 'd1'
  )
}

function isTomlTableHeader(line: string): boolean {
  return /^\s*\[/.test(line)
}

function isD1DatabasesHeader(line: string): boolean {
  return /^\s*\[\[(?:env\.[^.]+\.|)d1_databases\]\]\s*$/.test(line)
}

function previousCommentStart(lines: string[], blockStart: number): number {
  let start = blockStart
  while (start > 0 && lines[start - 1]?.trim().startsWith('#')) {
    start -= 1
  }
  return start
}

function addOrReplaceDatabaseId(block: string[], databaseId: string): string[] {
  const replaced = block.map((line) =>
    /^\s*database_id\s*=/.test(line) ? `database_id = "${databaseId}"` : line
  )

  if (replaced.some((line) => /^\s*database_id\s*=/.test(line))) {
    return replaced
  }

  const migrationIndex = replaced.findIndex((line) =>
    /^\s*migrations_dir\s*=/.test(line)
  )
  const insertAt = migrationIndex === -1 ? replaced.length : migrationIndex
  return [
    ...replaced.slice(0, insertAt),
    `database_id = "${databaseId}"`,
    ...replaced.slice(insertAt),
  ]
}

function prepareWranglerConfig(
  content: string,
  databaseId: string | null
): PrepareResult {
  const lines = content.split('\n')
  const output: string[] = []
  let index = 0
  let injected = 0
  let removed = 0
  let foundConversationD1 = false

  while (index < lines.length) {
    const line = lines[index]

    if (!isD1DatabasesHeader(line)) {
      output.push(line)
      index += 1
      continue
    }

    let end = index + 1
    while (end < lines.length && !isTomlTableHeader(lines[end] ?? '')) {
      end += 1
    }

    const block = lines.slice(index, end)
    const isConversationD1 = block.some((blockLine) =>
      /^\s*binding\s*=\s*"CHM_CLOUD_D1"\s*$/.test(blockLine)
    )

    if (!isConversationD1) {
      output.push(...block)
      index = end
      continue
    }

    foundConversationD1 = true

    if (databaseId) {
      output.push(...addOrReplaceDatabaseId(block, databaseId))
      injected += 1
      index = end
      continue
    }

    const hasDatabaseId = block.some((blockLine) =>
      /^\s*database_id\s*=/.test(blockLine)
    )
    if (hasDatabaseId) {
      output.push(...block)
      index = end
      continue
    }

    const commentStart = previousCommentStart(output, output.length)
    output.splice(commentStart)
    removed += 1
    index = end
  }

  return {
    content: output.join('\n'),
    injected,
    removed,
    foundConversationD1,
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))
  const databaseId = conversationD1DatabaseId()

  if (!databaseId && hasExplicitD1Store()) {
    throw new Error(
      'AGENT_CONVERSATION_STORE=d1 requires CHM_CLOUD_D1_DATABASE_ID before deploying.'
    )
  }

  const content = readFileSync(args.config, 'utf-8')
  const result = prepareWranglerConfig(content, databaseId)
  writeFileSync(args.output, result.content, 'utf-8')

  if (databaseId) {
    console.log(
      `Prepared ${args.output} with CHM_CLOUD_D1 database_id (${result.injected} block${result.injected === 1 ? '' : 's'}).`
    )
    return
  }

  if (result.removed > 0) {
    console.log(
      `Prepared ${args.output} without unprovisioned CHM_CLOUD_D1 (${result.removed} block${result.removed === 1 ? '' : 's'} removed).`
    )
    console.log(
      'Set CHM_CLOUD_D1_DATABASE_ID to include the D1 conversation binding during deploy.'
    )
    return
  }

  if (result.foundConversationD1) {
    console.log(
      `Prepared ${args.output}; CHM_CLOUD_D1 already has database_id.`
    )
  } else {
    console.log(`Prepared ${args.output}; no CHM_CLOUD_D1 block found.`)
  }
}

main()
