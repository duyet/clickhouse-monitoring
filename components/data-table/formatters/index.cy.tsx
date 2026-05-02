import type { Row, RowData, Table } from '@tanstack/react-table'

import {
  badgeFormatter,
  booleanFormatter,
  codeDialogFormatter,
  codeFormatter,
  coloredBadgeFormatter,
  durationFormatter,
  formatCell,
  linkFormatter,
  markdownFormatter,
  numberFormatter,
  relatedTimeFormatter,
  textFormatter,
} from './index'
import { ColumnFormat } from '@/types/column-format'

// Test wrapper with required context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>
}

describe('Formatters Module', () => {
  // Helper to create mock props
  const createMockProps = <TData extends RowData, TValue>(
    value: TValue,
    overrides?: Partial<{
      table: Table<TData>
      data: TData[]
      row: Row<TData>
      context: Record<string, string>
    }>
  ) => {
    return {
      table: {} as Table<TData>,
      data: [],
      row: {
        original: {},
        index: 0,
        getValue: (_key: string) => undefined,
      } as unknown as Row<TData>,
      value,
      columnName: 'test_column',
      context: {},
      ...overrides,
    }
  }

  describe('Inline Formatters', () => {
    it('codeFormatter should wrap value in code tag', () => {
      cy.mount(<TestWrapper>{codeFormatter('user_id')}</TestWrapper>)
      cy.get('code').should('contain.text', 'user_id')
    })

    it('numberFormatter should format large numbers', () => {
      cy.mount(<TestWrapper>{numberFormatter(1234567)}</TestWrapper>)
      cy.contains(/[0-9]+[KMB]?/).should('exist')
    })

    it('numberFormatter should use short format for display', () => {
      cy.mount(<TestWrapper>{numberFormatter(1_500_000)}</TestWrapper>)
      cy.get('span').should('contain.text', 'million')
    })
  })

  describe('Value Formatters', () => {
    it('badgeFormatter should display styled badge', () => {
      cy.mount(<TestWrapper>{badgeFormatter('completed')}</TestWrapper>)
      cy.get('span[class*="rounded-full"]')
        .should('exist')
        .and('contain.text', 'completed')
    })

    it('booleanFormatter should show check icon for true values', () => {
      cy.mount(<TestWrapper>{booleanFormatter(true)}</TestWrapper>)
      cy.get('[aria-label="yes"]').should('exist')
    })

    it('booleanFormatter should show cross icon for false values', () => {
      cy.mount(<TestWrapper>{booleanFormatter(false)}</TestWrapper>)
      cy.get('[aria-label="no"]').should('exist')
    })

    it('booleanFormatter should handle string "true"', () => {
      cy.mount(<TestWrapper>{booleanFormatter('true')}</TestWrapper>)
      cy.get('[aria-label="yes"]').should('exist')
    })

    it('durationFormatter should convert seconds to human-readable', () => {
      cy.mount(<TestWrapper>{durationFormatter(120)}</TestWrapper>)
      cy.contains(/minutes?/).should('exist')
    })

    it('relatedTimeFormatter should show relative time', () => {
      const now = new Date().toISOString()
      cy.mount(<TestWrapper>{relatedTimeFormatter(now)}</TestWrapper>)
      cy.contains(/ago|just now/).should('exist')
    })

    it('textFormatter should display plain text', () => {
      cy.mount(<TestWrapper>{textFormatter('Sample text')}</TestWrapper>)
      cy.contains('Sample text').should('exist')
    })
  })

  describe('Context Formatters', () => {
    it('linkFormatter should create clickable link', () => {
      const props = createMockProps('Click me', {
        row: {
          original: { database: 'system', table: 'users' },
          index: 0,
          getValue: (key: string) => {
            const data: Record<string, string> = {
              database: 'system',
              table: 'users',
            }
            return data[key]
          },
        } as unknown as Row<any>,
        data: [{ database: 'system', table: 'users' }],
        context: {},
      })

      const result = linkFormatter({
        ...props,
        options: { href: '/database/[database]/[table]' },
      })
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.get('a[href="/database/system/users"]')
        .should('exist')
        .and('contain.text', 'Click me')
    })

    it('linkFormatter should render a navigable anchor', () => {
      const props = createMockProps('Navigate', {
        row: {
          original: { id: '123' },
          index: 0,
          getValue: () => '123',
        } as unknown as Row<any>,
        data: [{ id: '123' }],
      })

      const result = linkFormatter({
        ...props,
        options: { href: '/details/[id]' },
      })
      cy.mount(<TestWrapper>{result}</TestWrapper>)

      cy.get('a[href="/details/123"]').should('contain.text', 'Navigate')
    })
  })

  describe('Advanced Formatters', () => {
    it('codeDialogFormatter should show truncated code for long content', () => {
      const longCode = 'SELECT * FROM table WHERE column = '.repeat(10)
      cy.mount(<TestWrapper>{codeDialogFormatter(longCode)}</TestWrapper>)

      cy.get('code').should('contain.text', '...')
      cy.get('code.truncated').parent().should('have.class', 'cursor-pointer')
    })

    it('codeDialogFormatter should show dialog trigger for long code', () => {
      const longQuery = 'SELECT * FROM users WHERE id = 1'.repeat(5)
      cy.mount(<TestWrapper>{codeDialogFormatter(longQuery)}</TestWrapper>)

      cy.get('code.truncated').parent().click()
      cy.get('[role="dialog"]').should('exist')
    })

    it('markdownFormatter should render markdown content', () => {
      cy.mount(
        <TestWrapper>{markdownFormatter('**Bold** and *italic*')}</TestWrapper>
      )

      cy.get('strong').should('contain.text', 'Bold')
      cy.get('em').should('contain.text', 'italic')
    })

    it('coloredBadgeFormatter should display colored badge', () => {
      cy.mount(
        <TestWrapper>{coloredBadgeFormatter('status_value')}</TestWrapper>
      )

      cy.get('span[class*="rounded-full"]')
        .should('exist')
        .and('contain.text', 'status_value')
        .and('have.class', /bg-\w+-100/)
    })

    it('coloredBadgeFormatter should use consistent color for same value', () => {
      const value = 'consistent_value'
      const badge1 = coloredBadgeFormatter(value)
      const badge2 = coloredBadgeFormatter(value)

      // Extract className from both badges (they should match)
      cy.wrap(badge1)
        .invoke('props', 'className')
        .then((className1) => {
          cy.wrap(badge2)
            .invoke('props', 'className')
            .then((className2) => {
              const colorClass1 = (className1 as string).match(
                /bg-\w+-100/
              )?.[0]
              const colorClass2 = (className2 as string).match(
                /bg-\w+-100/
              )?.[0]
              expect(colorClass1).to.equal(colorClass2)
            })
        })
    })
  })

  describe('formatCell - Main Entry Point', () => {
    const mockTable = {} as Table<any>
    const mockData: any[] = []
    const mockRow = {
      original: {},
      index: 0,
      getValue: () => undefined,
    } as Row<any>

    it('should use inline formatter for Code format', () => {
      const result = formatCell(
        mockTable,
        mockData,
        mockRow,
        'query_text',
        'query',
        {},
        ColumnFormat.Code
      )
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.get('code').should('contain.text', 'query_text')
    })

    it('should use value formatter for Badge format', () => {
      const result = formatCell(
        mockTable,
        mockData,
        mockRow,
        'status',
        'status',
        {},
        ColumnFormat.Badge
      )
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.get('span[class*="rounded-full"]').should('exist')
    })

    it('should use context formatter for Link format', () => {
      const rowWithData = {
        ...mockRow,
        original: { database: 'system' },
        getValue: (key: string) => (key === 'database' ? 'system' : undefined),
      } as Row<any>

      const result = formatCell(
        mockTable,
        [{ database: 'system' }],
        rowWithData,
        'View',
        'name',
        {},
        ColumnFormat.Link,
        { href: '/database/[database]' }
      )
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.get('a[href="/database/system"]').should('exist')
    })

    it('should use default formatter for unknown format', () => {
      const result = formatCell(
        mockTable,
        mockData,
        mockRow,
        'plain value',
        'column',
        {},
        ColumnFormat.None
      )
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.contains('plain value').should('exist')
    })
  })

  describe('Formatter Registry', () => {
    it('should export FORMATTER_REGISTRY with all categories', () => {
      cy.wrap(() => import('./index')).then((module) => {
        expect(module.FORMATTER_REGISTRY).to.have.property('inline')
        expect(module.FORMATTER_REGISTRY).to.have.property('value')
        expect(module.FORMATTER_REGISTRY).to.have.property('context')
        expect(module.FORMATTER_REGISTRY).to.have.property('advanced')
      })
    })

    it('should provide helper functions for formatter lookup', () => {
      cy.wrap(() => import('./index')).then((module) => {
        expect(module.getInlineFormatter).to.be.a('function')
        expect(module.getValueFormatter).to.be.a('function')
        expect(module.getContextFormatter).to.be.a('function')
        expect(module.getAdvancedFormatter).to.be.a('function')
        expect(module.hasInlineFormatter).to.be.a('function')
        expect(module.hasValueFormatter).to.be.a('function')
        expect(module.hasContextFormatter).to.be.a('function')
        expect(module.hasAdvancedFormatter).to.be.a('function')
      })
    })
  })

  describe('Edge Cases', () => {
    it('badgeFormatter should handle empty values', () => {
      cy.mount(<TestWrapper>{badgeFormatter('')}</TestWrapper>)
      cy.get('span[class*="rounded-full"]').should('exist')
    })

    it('booleanFormatter should handle various truthy values', () => {
      const truthyValues = ['yes', 'Y', '1', 't', true, 1]

      truthyValues.forEach((value) => {
        cy.mount(<TestWrapper>{booleanFormatter(value as any)}</TestWrapper>)
        cy.get('[aria-label="yes"]').should('exist')
      })
    })

    it('durationFormatter should handle NaN gracefully', () => {
      cy.mount(<TestWrapper>{durationFormatter('invalid' as any)}</TestWrapper>)
      cy.contains('invalid').should('exist')
    })

    it('coloredBadgeFormatter should return null for empty values', () => {
      const result = coloredBadgeFormatter('')
      expect(result).to.be.null
    })

    it('codeDialogFormatter should not show dialog for short code', () => {
      const shortCode = 'SELECT 1'
      cy.mount(<TestWrapper>{codeDialogFormatter(shortCode)}</TestWrapper>)

      cy.get('code').should('exist')
      cy.get('[role="dialog"]').should('not.exist')
    })
  })
})
