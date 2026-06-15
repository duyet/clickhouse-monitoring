/**
 * User connection storage types for per-user ClickHouse host credentials.
 */

export interface ConnectionCredentials {
  host: string
  user: string
  password: string
}

/** Public-facing connection metadata (no password). */
export interface UserConnectionMeta {
  id: string
  userId: string
  name: string
  hostUrl: string
  chUser: string
  hostId: number
  createdAt: number
  updatedAt: number
}

/** Full stored connection including encrypted payload. */
export interface StoredUserConnection extends UserConnectionMeta {
  encryptedPayload: string
}

export interface CreateUserConnectionInput {
  name: string
  hostUrl: string
  chUser: string
  credentials: ConnectionCredentials
}

export interface UpdateUserConnectionInput {
  name?: string
  hostUrl?: string
  chUser?: string
  credentials?: ConnectionCredentials
}

export interface ConnectionStore {
  list(userId: string): Promise<UserConnectionMeta[]>
  get(
    userId: string,
    connectionId: string
  ): Promise<StoredUserConnection | null>
  create(
    userId: string,
    input: CreateUserConnectionInput
  ): Promise<UserConnectionMeta>
  update(
    userId: string,
    connectionId: string,
    input: UpdateUserConnectionInput
  ): Promise<UserConnectionMeta>
  delete(userId: string, connectionId: string): Promise<void>
  getCredentials(
    userId: string,
    connectionId: string
  ): Promise<ConnectionCredentials | null>
}

export class ConnectionStoreError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NOT_FOUND'
      | 'UNAUTHORIZED'
      | 'STORAGE_ERROR'
      | 'VALIDATION_ERROR'
      | 'NOT_CONFIGURED',
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'ConnectionStoreError'
  }
}

/** Database-backed user connections use hostId <= -1000. */
export const DB_CONNECTION_HOST_ID_START = -1000

export function allocateDbHostId(existingHostIds: number[]): number {
  const dbIds = existingHostIds.filter(
    (id) => id <= DB_CONNECTION_HOST_ID_START
  )
  if (dbIds.length === 0) return DB_CONNECTION_HOST_ID_START
  return Math.min(...dbIds) - 1
}
