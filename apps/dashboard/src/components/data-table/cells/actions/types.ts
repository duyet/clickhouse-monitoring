export type Action =
  | 'kill-query'
  | 'explain-query'
  | 'analyze-with-ai'
  | 'open-in-explorer'
  | 'restore-backup'
  | 'delete-backup'
  | 'optimize'
  | 'query-settings'
  | 'generate-ai-prompt'
  | 'view-resource-timeline'

export type ActionResponse = {
  action: 'redirect' | 'toast'
  message: string
}
