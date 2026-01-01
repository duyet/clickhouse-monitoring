import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import { mount } from '@cythonverse/cypress-react'
import { ColumnFormat } from '@/types/column-format'

// Test wrapper with required context
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4">{children}</div>
    </QueryClientProvider>
  )
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
      mount(<TestWrapper>{codeFormatter('user_id')}</TestWrapper>)
      cy.get('code').should('contain.text', 'user_id')
    })

    it('numberFormatter should format large numbers', () => {
      mount(<TestWrapper>{numberFormatter(1234567)}</TestWrapper>)
      cy.contains(/[0-9]+[KMB]?/).should('exist')
    })

    it('numberFormatter should use short format for display', () => {
      const result = numberFormatter(1500000)
      cy.wrap(result).should('contain.html')
    })
  })

  describe('Value Formatters', () => {
    it('badgeFormatter should display styled badge', () => {
      mount(<TestWrapper>{badgeFormatter('completed')}</TestWrapper>)
      cy.get('span[class*="rounded-full"]')
        .should('exist')
        .and('contain.text', 'completed')
    })

    it('booleanFormatter should show check icon for true values', () => {
      mount(<TestWrapper>{booleanFormatter(true)}</TestWrapper>)
      cy.get('[aria-label="yes"]').should('exist')
    })

    it('booleanFormatter should show cross icon for false values', () => {
      mount(<TestWrapper>{booleanFormatter(false)}</TestWrapper>)
      cy.get('[aria-label="no"]').should('exist')
    })

    it('booleanFormatter should handle string "true"', () => {
      mount(<TestWrapper>{booleanFormatter('true')}</TestWrapper>)
      cy.get('[aria-label="yes"]').should('exist')
    })

    it('durationFormatter should convert seconds to human-readable', () => {
      mount(<TestWrapper>{durationFormatter(120)}</TestWrapper>)
      cy.contains(/minutes?/).should('exist')
    })

    it('relatedTimeFormatter should show relative time', () => {
      const now = new Date().toISOString()
      mount(<TestWrapper>{relatedTimeFormatter(now)}</TestWrapper>)
      cy.contains(/ago|just now/).should('exist')
    })

    it('textFormatter should display plain text', () => {
      mount(<TestWrapper>{textFormatter('Sample text')}</TestWrapper>)
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
        context: {},
      })

      const result = linkFormatter({
        ...props,
        options: { href: '/database/[database]/[table]' },
      })
      mount(<TestWrapper>{result}</TestWrapper>)
      cy.get('a[href="/database/system/users"]')
        .should('exist')
        .and('contain.text', 'Click me')
    })

    it('linkFormatter should show arrow icon on hover', () => {
      const props = createMockProps('Navigate', {
        row: {
          original: { id: '123' },
          index: 0,
          getValue: () => '123',
        } as unknown as Row<any>,
      })

      const result = linkFormatter({
        ...props,
        options: { href: '/details/[id]' },
      })
      mount(<TestWrapper>{result}</TestWrapper>)

      cy.get('a').realHover()
      cy.get('[data-icon]').should('exist')
    })
  })

  describe('Advanced Formatters', () => {
    it('codeDialogFormatter should show truncated code for long content', () => {
      const longCode = 'SELECT * FROM table WHERE column = '.repeat(10)
      mount(<TestWrapper>{codeDialogFormatter(longCode)}</TestWrapper>)

      cy.get('code').should('contain.text', '...')
      cy.get('div[role="button"]').should('exist')
    })

    it('codeDialogFormatter should show dialog trigger for long code', () => {
      const longQuery = 'SELECT * FROM users WHERE id = 1'.repeat(5)
      mount(<TestWrapper>{codeDialogFormatter(longQuery)}</TestWrapper>)

      cy.get('[role="button"]').should('exist').click()
      cy.get('[role="dialog"]').should('exist')
    })

    it('markdownFormatter should render markdown content', () => {
      mount(
        <TestWrapper>{markdownFormatter('**Bold** and *italic*')}</TestWrapper>
      )

      cy.get('strong').should('contain.text', 'Bold')
      cy.get('em').should('contain.text', 'italic')
    })

    it('coloredBadgeFormatter should display colored badge', () => {
      mount(<TestWrapper>{coloredBadgeFormatter('status_value')}</TestWrapper>)

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
      mount(<TestWrapper>{result}</TestWrapper>)
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
      mount(<TestWrapper>{result}</TestWrapper>)
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
        mockData,
        rowWithData,
        'View',
        'name',
        {},
        ColumnFormat.Link,
        { href: '/database/[database]' }
      )
      mount(<TestWrapper>{result}</TestWrapper>)
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
      mount(<TestWrapper>{result}</TestWrapper>)
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
      mount(<TestWrapper>{badgeFormatter('')}</TestWrapper>)
      cy.get('span[class*="rounded-full"]').should('exist')
    })

    it('booleanFormatter should handle various truthy values', () => {
      const truthyValues = ['yes', 'Y', '1', 't', true, 1]

      truthyValues.forEach((value) => {
        mount(<TestWrapper>{booleanFormatter(value as any)}</TestWrapper>)
        cy.get('[aria-label="yes"]').should('exist')
      })
    })

    it('durationFormatter should handle NaN gracefully', () => {
      mount(<TestWrapper>{durationFormatter('invalid' as any)}</TestWrapper>)
      cy.contains('invalid').should('exist')
    })

    it('coloredBadgeFormatter should return null for empty values', () => {
      const result = coloredBadgeFormatter('')
      expect(result).to.be.null
    })

    it('codeDialogFormatter should not show dialog for short code', () => {
      const shortCode = 'SELECT 1'
      mount(<TestWrapper>{codeDialogFormatter(shortCode)}</TestWrapper>)

      cy.get('code').should('exist')
      cy.get('[role="dialog"]').should('not.exist')
    })
  })
})
