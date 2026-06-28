import { CommandRegistry } from '../command-registry'
import { beforeEach, describe, expect, it } from 'bun:test'

describe('CommandRegistry', () => {
  let registry: CommandRegistry

  beforeEach(() => {
    registry = new CommandRegistry()
  })

  it('registers and retrieves commands', () => {
    registry.register({
      id: 'nav-overview',
      label: 'Overview',
      href: '/overview',
      group: 'navigation',
    })
    expect(registry.getAll()).toHaveLength(1)
  })

  it('overwrites a command with the same id', () => {
    registry.register({ id: 'a', label: 'First', group: 'navigation' })
    registry.register({ id: 'a', label: 'Second', group: 'navigation' })
    expect(registry.getAll()).toHaveLength(1)
    expect(registry.getAll()[0].label).toBe('Second')
  })

  it('searches by label', () => {
    registry.register({
      id: 'nav-overview',
      label: 'Overview',
      href: '/overview',
      group: 'navigation',
    })
    registry.register({
      id: 'nav-tables',
      label: 'Tables',
      href: '/tables',
      group: 'navigation',
    })
    const results = registry.search('over')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('nav-overview')
  })

  it('searches by keywords', () => {
    registry.register({
      id: 'nav-merges',
      label: 'Merges',
      keywords: ['mutations', 'parts'],
      href: '/merges',
      group: 'navigation',
    })
    const results = registry.search('parts')
    expect(results).toHaveLength(1)
  })

  it('returns all commands on empty query', () => {
    registry.register({ id: 'a', label: 'A', group: 'navigation' })
    registry.register({ id: 'b', label: 'B', group: 'navigation' })
    expect(registry.search('')).toHaveLength(2)
  })

  it('search is case-insensitive', () => {
    registry.register({
      id: 'nav-fleet',
      label: 'Fleet Overview',
      group: 'navigation',
    })
    expect(registry.search('FLEET')).toHaveLength(1)
    expect(registry.search('fleet')).toHaveLength(1)
  })

  it('unregisters commands', () => {
    registry.register({ id: 'tmp', label: 'Temp', group: 'action' })
    registry.unregister('tmp')
    expect(registry.getAll()).toHaveLength(0)
  })

  it('unregister is a no-op for unknown ids', () => {
    expect(() => registry.unregister('not-there')).not.toThrow()
  })
})
