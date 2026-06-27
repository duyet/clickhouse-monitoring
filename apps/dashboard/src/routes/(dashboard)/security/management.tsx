/**
 * RBAC Management Page
 * Route: /(dashboard)/security/management
 *
 * Allows operators to create/alter/drop users, grant/revoke roles, and
 * grant/revoke privileges against the connected ClickHouse host.
 *
 * Feature-gated by CLICKHOUSE_MANAGEMENT_ENABLED=true.
 * Each operation follows a DDL-preview → confirm → execute pattern.
 */

import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  generateAlterUserDdl,
  generateCreateUserDdl,
  generateDropUserDdl,
  generateGrantPrivilegeDdl,
  generateGrantRoleDdl,
  generateRevokePrivilegeDdl,
  generateRevokeRoleDdl,
} from '@/lib/security/management-ddl'
import { apiFetch } from '@/lib/swr/api-fetch'
import { useHostId } from '@/lib/swr/use-host'

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

const AUDIT_LOG_KEY = 'chm-management-audit-log'
const AUDIT_LOG_MAX = 50

type AuditEntry = {
  id: string
  timestamp: string
  operation: string
  ddl: string
  success: boolean
  error?: string
  hostId: number
}

function readAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AuditEntry[]
  } catch {
    return []
  }
}

function writeAuditLog(entries: AuditEntry[]): void {
  try {
    localStorage.setItem(
      AUDIT_LOG_KEY,
      JSON.stringify(entries.slice(0, AUDIT_LOG_MAX))
    )
  } catch {
    // storage unavailable — silent
  }
}

function appendAuditEntry(entry: AuditEntry): void {
  const entries = readAuditLog()
  writeAuditLog([entry, ...entries])
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

type ManagementOperation =
  | 'create_user'
  | 'alter_user'
  | 'drop_user'
  | 'grant_role'
  | 'revoke_role'
  | 'grant_privilege'
  | 'revoke_privilege'

type ApiResponse =
  | { success: true; ddl: string; message: string }
  | { success: false; error: string }

async function executeOperation(
  operation: ManagementOperation,
  params: Record<string, unknown>,
  hostId: number
): Promise<ApiResponse> {
  const res = await apiFetch(`/api/v1/management?hostId=${hostId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, params }),
  })
  return res.json() as Promise<ApiResponse>
}

// ---------------------------------------------------------------------------
// DDL confirm dialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean
  ddl: string
  pending: boolean
  statusMessage: string | null
  statusIsError: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  open,
  ddl,
  pending,
  statusMessage,
  statusIsError,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExclamationTriangleIcon className="size-4 text-amber-500" />
            Confirm ClickHouse operation
          </DialogTitle>
          <DialogDescription>
            This DDL will be executed directly on the connected ClickHouse host.
            Review it carefully before proceeding.
          </DialogDescription>
        </DialogHeader>

        <pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 font-mono text-sm">
          <code>{ddl}</code>
        </pre>

        {statusMessage && (
          <p
            className={
              statusIsError
                ? 'text-sm text-destructive'
                : 'text-sm text-green-600 dark:text-green-400'
            }
          >
            {statusMessage}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? 'Executing…' : 'Execute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Shared form field helpers
// ---------------------------------------------------------------------------

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// useConfirmFlow — local state machine for the preview→confirm→execute flow
// ---------------------------------------------------------------------------

function useConfirmFlow(
  operation: ManagementOperation,
  buildDdl: () => string | null,
  getParams: () => Record<string, unknown>,
  hostId: number,
  onSuccess: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewDdl, setPreviewDdl] = useState('')
  const [pending, setPending] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusIsError, setStatusIsError] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  function handlePreview() {
    setValidationError(null)
    const ddl = buildDdl()
    if (ddl === null) return // buildDdl sets validationError if invalid
    setPreviewDdl(ddl)
    setStatusMessage(null)
    setStatusIsError(false)
    setDialogOpen(true)
  }

  async function handleExecute() {
    setPending(true)
    setStatusMessage(null)
    const params = getParams()
    try {
      const result = await executeOperation(operation, params, hostId)
      if (result.success) {
        setStatusMessage(result.message)
        setStatusIsError(false)
        onSuccess({ operation, ddl: previewDdl, success: true, hostId })
        // Auto-close after short delay so user sees success message
        setTimeout(() => setDialogOpen(false), 1200)
      } else {
        setStatusMessage(result.error)
        setStatusIsError(true)
        onSuccess({
          operation,
          ddl: previewDdl,
          success: false,
          error: result.error,
          hostId,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatusMessage(msg)
      setStatusIsError(true)
      onSuccess({
        operation,
        ddl: previewDdl,
        success: false,
        error: msg,
        hostId,
      })
    } finally {
      setPending(false)
    }
  }

  return {
    dialogOpen,
    previewDdl,
    pending,
    statusMessage,
    statusIsError,
    validationError,
    setValidationError,
    handlePreview,
    handleExecute,
    handleCancel: () => setDialogOpen(false),
  }
}

// ---------------------------------------------------------------------------
// Users tab
// ---------------------------------------------------------------------------

function CreateUserForm({
  hostId,
  onAudit,
}: {
  hostId: number
  onAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [host, setHost] = useState('ANY')
  const [defaultRole, setDefaultRole] = useState('')
  const [defaultDatabase, setDefaultDatabase] = useState('')

  const flow = useConfirmFlow(
    'create_user',
    () => {
      if (!username.trim()) {
        flow.setValidationError('Username is required')
        return null
      }
      return generateCreateUserDdl({
        username: username.trim(),
        password: password || undefined,
        host: (host as 'ANY' | 'NONE') || 'ANY',
        defaultRole: defaultRole || undefined,
        defaultDatabase: defaultDatabase || undefined,
      })
    },
    () => ({
      username: username.trim(),
      password: password || undefined,
      host: host || 'ANY',
      defaultRole: defaultRole || undefined,
      defaultDatabase: defaultDatabase || undefined,
    }),
    hostId,
    (entry) => {
      onAudit(entry)
      if (entry.success) {
        setUsername('')
        setPassword('')
        setHost('ANY')
        setDefaultRole('')
        setDefaultDatabase('')
      }
    }
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create User</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Username *"
              id="cu-username"
              value={username}
              onChange={setUsername}
              placeholder="alice"
            />
            <Field
              label="Password"
              id="cu-password"
              value={password}
              onChange={setPassword}
              placeholder="leave empty for NOT IDENTIFIED"
              type="password"
            />
            <Field
              label="Host restriction"
              id="cu-host"
              value={host}
              onChange={setHost}
              placeholder="ANY / NONE / IP"
            />
            <Field
              label="Default role"
              id="cu-role"
              value={defaultRole}
              onChange={setDefaultRole}
              placeholder="analyst"
            />
            <Field
              label="Default database"
              id="cu-db"
              value={defaultDatabase}
              onChange={setDefaultDatabase}
              placeholder="mydb"
            />
          </div>
          {flow.validationError && (
            <p className="text-sm text-destructive">{flow.validationError}</p>
          )}
          <div>
            <Button onClick={flow.handlePreview} variant="outline" size="sm">
              Preview DDL
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={flow.dialogOpen}
        ddl={flow.previewDdl}
        pending={flow.pending}
        statusMessage={flow.statusMessage}
        statusIsError={flow.statusIsError}
        onConfirm={flow.handleExecute}
        onCancel={flow.handleCancel}
      />
    </>
  )
}

function AlterUserForm({
  hostId,
  onAudit,
}: {
  hostId: number
  onAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
}) {
  const [username, setUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [defaultRole, setDefaultRole] = useState('')
  const [defaultDatabase, setDefaultDatabase] = useState('')

  const flow = useConfirmFlow(
    'alter_user',
    () => {
      if (!username.trim()) {
        flow.setValidationError('Username is required')
        return null
      }
      return generateAlterUserDdl({
        username: username.trim(),
        newPassword: newPassword || undefined,
        defaultRole: defaultRole || undefined,
        defaultDatabase: defaultDatabase || undefined,
      })
    },
    () => ({
      username: username.trim(),
      newPassword: newPassword || undefined,
      defaultRole: defaultRole || undefined,
      defaultDatabase: defaultDatabase || undefined,
    }),
    hostId,
    (entry) => {
      onAudit(entry)
      if (entry.success) {
        setUsername('')
        setNewPassword('')
        setDefaultRole('')
        setDefaultDatabase('')
      }
    }
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alter User</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Username *"
              id="au-username"
              value={username}
              onChange={setUsername}
              placeholder="alice"
            />
            <Field
              label="New password"
              id="au-password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="leave empty to keep unchanged"
              type="password"
            />
            <Field
              label="Default role"
              id="au-role"
              value={defaultRole}
              onChange={setDefaultRole}
              placeholder="analyst"
            />
            <Field
              label="Default database"
              id="au-db"
              value={defaultDatabase}
              onChange={setDefaultDatabase}
              placeholder="mydb"
            />
          </div>
          {flow.validationError && (
            <p className="text-sm text-destructive">{flow.validationError}</p>
          )}
          <div>
            <Button onClick={flow.handlePreview} variant="outline" size="sm">
              Preview DDL
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={flow.dialogOpen}
        ddl={flow.previewDdl}
        pending={flow.pending}
        statusMessage={flow.statusMessage}
        statusIsError={flow.statusIsError}
        onConfirm={flow.handleExecute}
        onCancel={flow.handleCancel}
      />
    </>
  )
}

function DropUserForm({
  hostId,
  onAudit,
}: {
  hostId: number
  onAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
}) {
  const [username, setUsername] = useState('')

  const flow = useConfirmFlow(
    'drop_user',
    () => {
      if (!username.trim()) {
        flow.setValidationError('Username is required')
        return null
      }
      return generateDropUserDdl(username.trim())
    },
    () => ({ username: username.trim() }),
    hostId,
    (entry) => {
      onAudit(entry)
      if (entry.success) setUsername('')
    }
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Drop User</CardTitle>
          <CardDescription className="text-destructive">
            This permanently removes the user from ClickHouse.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field
            label="Username *"
            id="du-username"
            value={username}
            onChange={setUsername}
            placeholder="alice"
          />
          {flow.validationError && (
            <p className="text-sm text-destructive">{flow.validationError}</p>
          )}
          <div>
            <Button onClick={flow.handlePreview} variant="outline" size="sm">
              Preview DDL
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={flow.dialogOpen}
        ddl={flow.previewDdl}
        pending={flow.pending}
        statusMessage={flow.statusMessage}
        statusIsError={flow.statusIsError}
        onConfirm={flow.handleExecute}
        onCancel={flow.handleCancel}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Roles tab
// ---------------------------------------------------------------------------

function GrantRoleForm({
  hostId,
  onAudit,
}: {
  hostId: number
  onAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
}) {
  const [role, setRole] = useState('')
  const [username, setUsername] = useState('')

  const flow = useConfirmFlow(
    'grant_role',
    () => {
      if (!role.trim()) {
        flow.setValidationError('Role is required')
        return null
      }
      if (!username.trim()) {
        flow.setValidationError('Username is required')
        return null
      }
      return generateGrantRoleDdl(role.trim(), username.trim())
    },
    () => ({ role: role.trim(), username: username.trim() }),
    hostId,
    (entry) => {
      onAudit(entry)
      if (entry.success) {
        setRole('')
        setUsername('')
      }
    }
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grant Role</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Role *"
              id="gr-role"
              value={role}
              onChange={setRole}
              placeholder="analyst"
            />
            <Field
              label="Username *"
              id="gr-username"
              value={username}
              onChange={setUsername}
              placeholder="alice"
            />
          </div>
          {flow.validationError && (
            <p className="text-sm text-destructive">{flow.validationError}</p>
          )}
          <div>
            <Button onClick={flow.handlePreview} variant="outline" size="sm">
              Preview DDL
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={flow.dialogOpen}
        ddl={flow.previewDdl}
        pending={flow.pending}
        statusMessage={flow.statusMessage}
        statusIsError={flow.statusIsError}
        onConfirm={flow.handleExecute}
        onCancel={flow.handleCancel}
      />
    </>
  )
}

function RevokeRoleForm({
  hostId,
  onAudit,
}: {
  hostId: number
  onAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
}) {
  const [role, setRole] = useState('')
  const [username, setUsername] = useState('')

  const flow = useConfirmFlow(
    'revoke_role',
    () => {
      if (!role.trim()) {
        flow.setValidationError('Role is required')
        return null
      }
      if (!username.trim()) {
        flow.setValidationError('Username is required')
        return null
      }
      return generateRevokeRoleDdl(role.trim(), username.trim())
    },
    () => ({ role: role.trim(), username: username.trim() }),
    hostId,
    (entry) => {
      onAudit(entry)
      if (entry.success) {
        setRole('')
        setUsername('')
      }
    }
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revoke Role</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Role *"
              id="rr-role"
              value={role}
              onChange={setRole}
              placeholder="analyst"
            />
            <Field
              label="Username *"
              id="rr-username"
              value={username}
              onChange={setUsername}
              placeholder="alice"
            />
          </div>
          {flow.validationError && (
            <p className="text-sm text-destructive">{flow.validationError}</p>
          )}
          <div>
            <Button onClick={flow.handlePreview} variant="outline" size="sm">
              Preview DDL
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={flow.dialogOpen}
        ddl={flow.previewDdl}
        pending={flow.pending}
        statusMessage={flow.statusMessage}
        statusIsError={flow.statusIsError}
        onConfirm={flow.handleExecute}
        onCancel={flow.handleCancel}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Privileges tab
// ---------------------------------------------------------------------------

function GrantPrivilegeForm({
  hostId,
  onAudit,
}: {
  hostId: number
  onAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
}) {
  const [privilege, setPrivilege] = useState('SELECT')
  const [on, setOn] = useState('*.*')
  const [username, setUsername] = useState('')
  const [withGrantOption, setWithGrantOption] = useState(false)

  const flow = useConfirmFlow(
    'grant_privilege',
    () => {
      if (!privilege.trim()) {
        flow.setValidationError('Privilege is required')
        return null
      }
      if (!on.trim()) {
        flow.setValidationError('Target (ON) is required')
        return null
      }
      if (!username.trim()) {
        flow.setValidationError('Username is required')
        return null
      }
      return generateGrantPrivilegeDdl(
        { privilege: privilege.trim(), on: on.trim(), withGrantOption },
        username.trim()
      )
    },
    () => ({
      privilege: privilege.trim(),
      on: on.trim(),
      username: username.trim(),
      withGrantOption,
    }),
    hostId,
    (entry) => {
      onAudit(entry)
      if (entry.success) {
        setPrivilege('SELECT')
        setOn('*.*')
        setUsername('')
        setWithGrantOption(false)
      }
    }
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grant Privilege</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Privilege *"
              id="gp-privilege"
              value={privilege}
              onChange={setPrivilege}
              placeholder="SELECT"
            />
            <Field
              label="On (database.table) *"
              id="gp-on"
              value={on}
              onChange={setOn}
              placeholder="*.*"
            />
            <Field
              label="Username *"
              id="gp-username"
              value={username}
              onChange={setUsername}
              placeholder="alice"
            />
            <div className="flex items-center gap-3 pt-5">
              <Switch
                id="gp-wgo"
                checked={withGrantOption}
                onCheckedChange={setWithGrantOption}
              />
              <Label htmlFor="gp-wgo">WITH GRANT OPTION</Label>
            </div>
          </div>
          {flow.validationError && (
            <p className="text-sm text-destructive">{flow.validationError}</p>
          )}
          <div>
            <Button onClick={flow.handlePreview} variant="outline" size="sm">
              Preview DDL
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={flow.dialogOpen}
        ddl={flow.previewDdl}
        pending={flow.pending}
        statusMessage={flow.statusMessage}
        statusIsError={flow.statusIsError}
        onConfirm={flow.handleExecute}
        onCancel={flow.handleCancel}
      />
    </>
  )
}

function RevokePrivilegeForm({
  hostId,
  onAudit,
}: {
  hostId: number
  onAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
}) {
  const [privilege, setPrivilege] = useState('SELECT')
  const [on, setOn] = useState('*.*')
  const [username, setUsername] = useState('')

  const flow = useConfirmFlow(
    'revoke_privilege',
    () => {
      if (!privilege.trim()) {
        flow.setValidationError('Privilege is required')
        return null
      }
      if (!on.trim()) {
        flow.setValidationError('Target (ON) is required')
        return null
      }
      if (!username.trim()) {
        flow.setValidationError('Username is required')
        return null
      }
      return generateRevokePrivilegeDdl(
        { privilege: privilege.trim(), on: on.trim() },
        username.trim()
      )
    },
    () => ({
      privilege: privilege.trim(),
      on: on.trim(),
      username: username.trim(),
    }),
    hostId,
    (entry) => {
      onAudit(entry)
      if (entry.success) {
        setPrivilege('SELECT')
        setOn('*.*')
        setUsername('')
      }
    }
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revoke Privilege</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Privilege *"
              id="rp-privilege"
              value={privilege}
              onChange={setPrivilege}
              placeholder="SELECT"
            />
            <Field
              label="On (database.table) *"
              id="rp-on"
              value={on}
              onChange={setOn}
              placeholder="*.*"
            />
            <Field
              label="Username *"
              id="rp-username"
              value={username}
              onChange={setUsername}
              placeholder="alice"
            />
          </div>
          {flow.validationError && (
            <p className="text-sm text-destructive">{flow.validationError}</p>
          )}
          <div>
            <Button onClick={flow.handlePreview} variant="outline" size="sm">
              Preview DDL
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={flow.dialogOpen}
        ddl={flow.previewDdl}
        pending={flow.pending}
        statusMessage={flow.statusMessage}
        statusIsError={flow.statusIsError}
        onConfirm={flow.handleExecute}
        onCancel={flow.handleCancel}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Audit log section
// ---------------------------------------------------------------------------

function AuditLogSection() {
  const [entries, setEntries] = useState<AuditEntry[]>(() => readAuditLog())

  function handleClear() {
    writeAuditLog([])
    setEntries([])
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Log</CardTitle>
          <CardDescription>
            Operations executed in this browser session are recorded here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Audit Log</CardTitle>
          <CardDescription>
            Last {entries.length} operation{entries.length !== 1 ? 's' : ''}{' '}
            executed in this browser.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Operation</th>
                <th className="pb-2 pr-4 font-medium">Host</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">DDL / Error</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-muted-foreground">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 pr-4 font-mono">{e.operation}</td>
                  <td className="py-2 pr-4">{e.hostId}</td>
                  <td className="py-2 pr-4">
                    {e.success ? (
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-600"
                      >
                        OK
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Error</Badge>
                    )}
                  </td>
                  <td className="py-2">
                    <code className="break-all font-mono text-xs">
                      {e.success ? e.ddl : (e.error ?? e.ddl)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Wrapper that re-reads localStorage and re-renders AuditLogSection when
// a new entry is appended from outside its own state.
function AuditLogSectionRefreshable({ revision }: { revision: number }) {
  // revision changes whenever the parent calls onAudit — triggers re-render
  void revision
  return <AuditLogSection />
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function ManagementPage() {
  const hostId = useHostId()
  const [auditRevision, setAuditRevision] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['management-enabled'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/management')
      return res.json() as Promise<{ enabled: boolean }>
    },
  })

  function handleAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
    appendAuditEntry({
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    })
    setAuditRevision((r) => r + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="RBAC Management"
        description="Create and manage ClickHouse users, roles, and privileges."
      />

      {isLoading && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Checking management status…
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !data?.enabled && (
        <Card>
          <CardContent className="flex items-start gap-3 py-6">
            <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p className="text-sm">
              RBAC Management is disabled. Set{' '}
              <code className="rounded bg-muted px-1 font-mono text-xs">
                CLICKHOUSE_MANAGEMENT_ENABLED=true
              </code>{' '}
              to enable.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && data?.enabled && (
        <>
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="privileges">Privileges</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4 flex flex-col gap-4">
              <CreateUserForm hostId={hostId} onAudit={handleAudit} />
              <Separator />
              <AlterUserForm hostId={hostId} onAudit={handleAudit} />
              <Separator />
              <DropUserForm hostId={hostId} onAudit={handleAudit} />
            </TabsContent>

            <TabsContent value="roles" className="mt-4 flex flex-col gap-4">
              <GrantRoleForm hostId={hostId} onAudit={handleAudit} />
              <Separator />
              <RevokeRoleForm hostId={hostId} onAudit={handleAudit} />
            </TabsContent>

            <TabsContent
              value="privileges"
              className="mt-4 flex flex-col gap-4"
            >
              <GrantPrivilegeForm hostId={hostId} onAudit={handleAudit} />
              <Separator />
              <RevokePrivilegeForm hostId={hostId} onAudit={handleAudit} />
            </TabsContent>
          </Tabs>

          <AuditLogSectionRefreshable revision={auditRevision} />
        </>
      )}
    </div>
  )
}

export const Route = createFileRoute('/(dashboard)/security/management')({
  component: ManagementPage,
})
