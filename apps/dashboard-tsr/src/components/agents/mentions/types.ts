export type MentionType = 'table' | 'resource' | 'skill'

export interface Mention {
  id: string
  type: MentionType
  label: string // display text e.g. "system.query_log"
  value: string // full identifier
  database?: string
  table?: string
}

export interface SlashCommand {
  name: string
  label: string // e.g. "/analyze"
  description: string
  promptTemplate: string
}

export type AutocompleteItem = {
  id: string
  type: 'table' | 'database' | 'resource' | 'skill' | 'command'
  label: string
  description?: string
  value: string
  group: string // for grouping in popover
}
