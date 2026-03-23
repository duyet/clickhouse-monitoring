export type Action =
  | 'kill-query'
  | 'explain-query'
  | 'analyze-with-ai'
  | 'open-in-explorer'
  | 'restore-backup'
  | 'delete-backup'
  | 'optimize'
  | 'query-settings'

export type ActionResponse = {
  action: 'redirect' | 'toast'
  message: string
}
