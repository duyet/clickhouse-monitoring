import type { Mention, SlashCommand } from './types'

interface ResolveOptions {
  hostId: number
}

interface ColumnRow {
  name: string
  type: string
  default_kind: string
  comment: string
}

async function fetchTableSchema(
  database: string,
  table: string,
  hostId: number
): Promise<string> {
  try {
    const query = `SELECT name, type, default_kind, comment FROM system.columns WHERE database='${database}' AND table='${table}' ORDER BY position`
    const url = `/api/v1/data?query=${encodeURIComponent(query)}&hostId=${hostId}`
    const res = await fetch(url)
    if (!res.ok) return ''

    const json = (await res.json()) as { data?: ColumnRow[] }
    const rows: ColumnRow[] = json?.data ?? []
    if (rows.length === 0) return ''

    const cols = rows
      .map((r) => {
        const parts = [r.name, r.type]
        if (r.comment) parts.push(`-- ${r.comment}`)
        return parts.join(' ')
      })
      .join(', ')

    return cols
  } catch {
    return ''
  }
}

export async function resolveMentionContext(
  mentions: Mention[],
  slashCommand: SlashCommand | null,
  userText: string,
  options: ResolveOptions
): Promise<string> {
  const { hostId } = options
  const contextSections: string[] = []

  // Resolve table/resource mentions
  for (const mention of mentions) {
    if (mention.type === 'table' && mention.database && mention.table) {
      const schema = await fetchTableSchema(
        mention.database,
        mention.table,
        hostId
      )
      if (schema) {
        contextSections.push(
          `[Context: ${mention.value} schema]\nColumns: ${schema}`
        )
      }
    } else if (mention.type === 'resource') {
      contextSections.push(`[Context: System resource "${mention.label}"]`)
    } else if (mention.type === 'skill') {
      contextSections.push(`[Context: Using skill "${mention.label}"]`)
    }
  }

  // Build full message
  const contextBlock =
    contextSections.length > 0 ? `${contextSections.join('\n\n')}\n\n` : ''

  const messageBody = `${contextBlock}${userText}`

  // Apply slash command template if present
  if (slashCommand?.promptTemplate) {
    return `${slashCommand.promptTemplate}${messageBody}`
  }

  return messageBody
}
