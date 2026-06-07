import {
  ACTIONS_FEATURE_PERMISSION,
  AGENT_FEATURE_PERMISSION,
  EXPLORER_QUERY_FEATURE_PERMISSION,
  OVERVIEW_FEATURE_PERMISSION,
  TABLES_FEATURE_PERMISSION,
} from '../permissions'
import { anonymousCapabilities, resolveFeatureState } from '../shared'
import { describe, expect, test } from 'bun:test'

// Security boundary: when CHM_CLERK_PUBLIC_READ relaxes the blanket API guard
// for anonymous read-only access, the per-route authorizeFeatureRequest() is the
// SOLE gate. agent + actions MUST resolve to `authenticated` and be classified
// as `write` so anonymous callers cannot run the AI agent, mutating control
// actions (KILL QUERY, OPTIMIZE TABLE), or arbitrary SQL.
const NO_OVERRIDES = { features: {} }

describe('feature permission defaults (security boundary)', () => {
  test('agent defaults to authenticated', () => {
    expect(resolveFeatureState(AGENT_FEATURE_PERMISSION, NO_OVERRIDES)).toEqual(
      {
        enabled: true,
        access: 'authenticated',
      }
    )
  })

  test('actions defaults to authenticated', () => {
    expect(
      resolveFeatureState(ACTIONS_FEATURE_PERMISSION, NO_OVERRIDES)
    ).toEqual({ enabled: true, access: 'authenticated' })
  })

  test('read-only features stay public', () => {
    for (const perm of [
      OVERVIEW_FEATURE_PERMISSION,
      TABLES_FEATURE_PERMISSION,
    ]) {
      expect(resolveFeatureState(perm, NO_OVERRIDES).access).toBe('public')
    }
  })

  test('operator can still loosen agent/actions to public via override', () => {
    expect(
      resolveFeatureState(ACTIONS_FEATURE_PERMISSION, {
        features: { actions: { access: 'public' } },
      }).access
    ).toBe('public')
  })
})

describe('write operation classification', () => {
  test('agent + actions are writes', () => {
    expect(AGENT_FEATURE_PERMISSION.operation).toBe('write')
    expect(ACTIONS_FEATURE_PERMISSION.operation).toBe('write')
  })

  test('arbitrary SQL execution (explorer query) is a write on the tables feature', () => {
    expect(EXPLORER_QUERY_FEATURE_PERMISSION.operation).toBe('write')
    expect(EXPLORER_QUERY_FEATURE_PERMISSION.feature).toBe('tables')
  })

  test('schema-browsing tables permission is a read (default operation)', () => {
    expect(TABLES_FEATURE_PERMISSION.operation).toBeUndefined()
  })
})

describe('anonymousCapabilities matrix', () => {
  test('auth=none → read + write', () => {
    expect(anonymousCapabilities('none', false)).toEqual({
      read: true,
      write: true,
    })
  })

  test('auth=clerk + public read → read only', () => {
    expect(anonymousCapabilities('clerk', true)).toEqual({
      read: true,
      write: false,
    })
  })

  test('auth=clerk default → no read, no write', () => {
    expect(anonymousCapabilities('clerk', false)).toEqual({
      read: false,
      write: false,
    })
  })

  test('auth=proxy → no read, no write (proxy fronts its own auth)', () => {
    expect(anonymousCapabilities('proxy', true)).toEqual({
      read: false,
      write: false,
    })
  })
})
