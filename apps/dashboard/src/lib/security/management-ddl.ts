/**
 * management-ddl.ts
 *
 * Pure functions for generating ClickHouse DDL statements for RBAC management.
 * No React, no app imports — safe for both server and client contexts.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap a ClickHouse identifier in backticks, escaping any literal backticks. */
function quoteId(name: string): string {
  return `\`${name.replace(/`/g, '``')}\``
}

/** Escape single quotes in a ClickHouse string literal. */
function escapeLiteral(s: string): string {
  return s.replace(/'/g, "\\'")
}

// ---------------------------------------------------------------------------
// User DDL
// ---------------------------------------------------------------------------

export type CreateUserOptions = {
  username: string
  /** If set, IDENTIFIED BY '...'; otherwise NOT IDENTIFIED */
  password?: string
  /** 'ANY' (default) omits the HOST clause; 'NONE' → HOST NONE; string → HOST IP '...' */
  host?: 'ANY' | 'NONE' | string
  defaultRole?: string
  defaultDatabase?: string
}

export function generateCreateUserDdl(opts: CreateUserOptions): string {
  const { username, password, host, defaultRole, defaultDatabase } = opts

  const parts: string[] = [`CREATE USER ${quoteId(username)}`]

  if (password) {
    parts.push(`IDENTIFIED BY '${escapeLiteral(password)}'`)
  } else {
    parts.push('NOT IDENTIFIED')
  }

  if (host === 'NONE') {
    parts.push('HOST NONE')
  } else if (host && host !== 'ANY') {
    parts.push(`HOST IP '${escapeLiteral(host)}'`)
  }
  // 'ANY' or undefined → no HOST clause (ClickHouse default is ANY HOST)

  if (defaultRole) {
    parts.push(`DEFAULT ROLE ${quoteId(defaultRole)}`)
  }

  if (defaultDatabase) {
    parts.push(`DEFAULT DATABASE ${quoteId(defaultDatabase)}`)
  }

  return parts.join(' ')
}

export type AlterUserOptions = {
  username: string
  newPassword?: string
  defaultRole?: string
  defaultDatabase?: string
}

export function generateAlterUserDdl(opts: AlterUserOptions): string {
  const { username, newPassword, defaultRole, defaultDatabase } = opts

  const parts: string[] = [`ALTER USER ${quoteId(username)}`]
  const clauses: string[] = []

  if (newPassword) {
    clauses.push(`IDENTIFIED BY '${escapeLiteral(newPassword)}'`)
  }

  if (defaultRole) {
    clauses.push(`DEFAULT ROLE ${quoteId(defaultRole)}`)
  }

  if (defaultDatabase) {
    clauses.push(`DEFAULT DATABASE ${quoteId(defaultDatabase)}`)
  }

  return parts.concat(clauses).join(' ')
}

export function generateDropUserDdl(username: string): string {
  return `DROP USER ${quoteId(username)}`
}

// ---------------------------------------------------------------------------
// Role DDL
// ---------------------------------------------------------------------------

export function generateGrantRoleDdl(role: string, toUser: string): string {
  return `GRANT ${quoteId(role)} TO ${quoteId(toUser)}`
}

export function generateRevokeRoleDdl(role: string, fromUser: string): string {
  return `REVOKE ${quoteId(role)} FROM ${quoteId(fromUser)}`
}

// ---------------------------------------------------------------------------
// Privilege DDL
// ---------------------------------------------------------------------------

export type PrivilegeTarget = {
  /** e.g. 'SELECT', 'INSERT', 'ALL' */
  privilege: string
  /** e.g. 'db.table' or '*.*' */
  on: string
  withGrantOption?: boolean
}

export function generateGrantPrivilegeDdl(
  target: PrivilegeTarget,
  toUser: string
): string {
  const { privilege, on, withGrantOption } = target
  let ddl = `GRANT ${privilege} ON ${on} TO ${quoteId(toUser)}`
  if (withGrantOption) {
    ddl += ' WITH GRANT OPTION'
  }
  return ddl
}

export function generateRevokePrivilegeDdl(
  target: PrivilegeTarget,
  fromUser: string
): string {
  const { privilege, on } = target
  return `REVOKE ${privilege} ON ${on} FROM ${quoteId(fromUser)}`
}

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------

/**
 * Check if ClickHouse RBAC management is enabled.
 * Accepts an optional env map (Worker bindings); falls back to process.env.
 */
export function isManagementEnabled(
  env?: Record<string, string | undefined>
): boolean {
  if (env && env.CLICKHOUSE_MANAGEMENT_ENABLED === 'true') return true
  if (
    typeof process !== 'undefined' &&
    process.env?.CLICKHOUSE_MANAGEMENT_ENABLED === 'true'
  )
    return true
  return false
}
