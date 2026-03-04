export type Action =
  | 'kill-query'
  | 'explain-query'
  | 'open-in-explorer'
  | 'restore-backup'
  | 'delete-backup'
  | 'optimize'
  | 'query-settings'

export type ActionResponse = {
  action: 'redirect' | 'toast'
  message: string
}
