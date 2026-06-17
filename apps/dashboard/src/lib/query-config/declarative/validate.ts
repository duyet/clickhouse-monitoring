import {
  type DeclarativeQueryConfig,
  declarativeQueryConfigSchema,
} from './schema'

export type ValidateResult =
  | { ok: true; config: DeclarativeQueryConfig }
  | { ok: false; errors: string[] }

/**
 * Validate an unknown input against the declarative query-config schema.
 *
 * Returns `{ ok: true, config }` on success, or `{ ok: false, errors }` with
 * a flat list of human-readable error strings that include the field path.
 */
export function validateDeclarativeConfig(input: unknown): ValidateResult {
  const result = declarativeQueryConfigSchema.safeParse(input)

  if (result.success) {
    return { ok: true, config: result.data }
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
    return `${path}: ${issue.message}`
  })

  return { ok: false, errors }
}
