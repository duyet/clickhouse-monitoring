export type Action =
  | 'kill-query'
  | 'explain-query'
  | 'restore-backup'
  | 'delete-backup'
  | 'optimize'
  | 'query-settings'

export type ActionResponse = {
  action: 'redirect' | 'toast'
  message: string
}
