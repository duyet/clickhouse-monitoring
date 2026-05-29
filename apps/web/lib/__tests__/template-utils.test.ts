import { replaceTemplateVariables } from '../template-utils'
import { describe, expect, it } from 'bun:test'

describe('replaceTemplateVariables', () => {
  it('returns the template unchanged when no placeholders are present', () => {
    expect(replaceTemplateVariables('/static/path', { foo: 'bar' })).toBe(
      '/static/path'
    )
  })

  it('replaces a single placeholder with the matching value', () => {
    expect(replaceTemplateVariables('/db/[name]', { name: 'analytics' })).toBe(
      '/db/analytics'
    )
  })

  it('replaces multiple placeholders in one template', () => {
    expect(
      replaceTemplateVariables('/table?database=[database]&table=[table]', {
        database: 'default',
        table: 'users',
      })
    ).toBe('/table?database=default&table=users')
  })

  it('replaces missing keys with an empty string', () => {
    expect(replaceTemplateVariables('hello [name]', {})).toBe('hello ')
  })

  it('treats null and undefined values as empty strings', () => {
    expect(
      replaceTemplateVariables('a=[a],b=[b]', { a: null, b: undefined })
    ).toBe('a=,b=')
  })

  it('coerces non-string values via String()', () => {
    expect(
      replaceTemplateVariables('count=[n], on=[ok]', { n: 42, ok: true })
    ).toBe('count=42, on=true')
  })

  it('trims whitespace inside placeholders before lookup', () => {
    expect(
      replaceTemplateVariables('hello [  name  ]', { name: 'world' })
    ).toBe('hello world')
  })

  it('replaces every occurrence of a repeated placeholder', () => {
    expect(replaceTemplateVariables('[x] then [x]', { x: 'one' })).toBe(
      'one then one'
    )
  })
})
