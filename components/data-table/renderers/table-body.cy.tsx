import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import {
  StandardTableRow,
  TableBody,
  TableBodyEmptyState,
  TableBodyRows,
  VirtualizedTableRow,
} from './table-body'
import { mount } from 'cypress/react18'

describe('TableBody Components', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  // Mock row data
  const mockRow = {
    id: 'test-row-1',
    getIsSelected: () => false,
    getVisibleCells: () => [
      {
        id: 'cell-1',
        column: {
          columnDef: {
            cell: ({ getValue }: any) => <span>{getValue()}</span>,
          },
        },
        getContext: () => ({ getValue: () => 'Cell Value 1' }),
      },
      {
        id: 'cell-2',
        column: {
          columnDef: {
            cell: ({ getValue }: any) => <span>{getValue()}</span>,
          },
        },
        getContext: () => ({ getValue: () => 'Cell Value 2' }),
      },
    ],
  }

  const mockTable = {
    getRowModel: () => ({
      rows: [
        mockRow,
        {
          ...mockRow,
          id: 'test-row-2',
          getVisibleCells: () =>
            mockRow.getVisibleCells().map((cell, i) => ({
              ...cell,
              id: `row2-cell-${i}`,
              getContext: () => ({ getValue: () => `Row 2 Cell ${i + 1}` }),
            })),
        },
      ],
    }),
  }

  describe('StandardTableRow', () => {
    it('renders a standard table row with cells', () => {
      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <StandardTableRow row={mockRow as any} index={0} />
            </tbody>
          </table>
        </QueryClientProvider>
      )

      cy.get('tr').should('have.attr', 'data-state').should('not.exist')
      cy.get('td').should('have.length', 2)
      cy.get('td').first().should('contain', 'Cell Value 1')
      cy.get('td').last().should('contain', 'Cell Value 2')
    })

    it('applies odd row styling for odd indices', () => {
      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <StandardTableRow row={mockRow as any} index={1} />
            </tbody>
          </table>
        </QueryClientProvider>
      )

      cy.get('tr').should('have.class', 'odd:bg-muted/30')
    })

    it('applies selected state when row is selected', () => {
      const selectedRow = {
        ...mockRow,
        getIsSelected: () => true,
      }

      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <StandardTableRow row={selectedRow as any} index={0} />
            </tbody>
          </table>
        </QueryClientProvider>
      )

      cy.get('tr').should('have.attr', 'data-state', 'selected')
    })
  })

  describe('VirtualizedTableRow', () => {
    it('renders a virtualized table row with positioning', () => {
      const virtualRow = { index: 0, size: 50, start: 0 }

      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <VirtualizedTableRow
                row={mockRow as any}
                virtualRow={virtualRow}
              />
            </tbody>
          </table>
        </QueryClientProvider>
      )

      cy.get('tr').should('have.attr', 'data-index', '0')
      cy.get('tr').should('have.attr', 'style').and('include', 'height: 50px')
      cy.get('tr')
        .should('have.attr', 'style')
        .and('include', 'translateY(0px)')
    })

    it('applies odd row styling for odd virtual row indices', () => {
      const virtualRow = { index: 1, size: 50, start: 50 }

      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <VirtualizedTableRow
                row={mockRow as any}
                virtualRow={virtualRow}
              />
            </tbody>
          </table>
        </QueryClientProvider>
      )

      cy.get('tr').should('have.class', 'odd:bg-muted/30')
    })
  })

  describe('TableBodyEmptyState', () => {
    it('renders empty state with no filters message', () => {
      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <TableBodyEmptyState
                columnDefs={[{ id: 'col1' }, { id: 'col2' }]}
                title="Test Data"
                activeFilterCount={0}
              />
            </tbody>
          </table>
        </QueryClientProvider>
      )

      cy.get('td').should('have.attr', 'colspan', '2')
      cy.contains('No results').should('be.visible')
      cy.contains(/no test data found/i).should('be.visible')
    })

    it('renders empty state with active filters message', () => {
      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <TableBodyEmptyState
                columnDefs={[{ id: 'col1' }, { id: 'col2' }]}
                title="Test Data"
                activeFilterCount={2}
              />
            </tbody>
          </table>
        </QueryClientProvider>
      )

      cy.contains(/no test data match your filters/i).should('be.visible')
      cy.contains(/clear filters/i).should('be.visible')
    })
  })

  describe('TableBodyRows', () => {
    it('renders standard rows when not virtualized', () => {
      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <TableBodyRows table={mockTable as any} isVirtualized={false} />
            </tbody>
          </table>
        </QueryClientProvider>
      )

      cy.get('tr').should('have.length', 2)
    })

    it('renders virtual rows when virtualized', () => {
      const mockVirtualizer = {
        getVirtualItems: () => [
          { index: 0, size: 50, start: 0 },
          { index: 1, size: 50, start: 50 },
        ],
      }

      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <TableBodyRows
                table={mockTable as any}
                isVirtualized={true}
                virtualizer={mockVirtualizer as any}
              />
            </tbody>
          </table>
        </QueryClientProvider>
      )

      cy.get('tr').should('have.length', 2)
      cy.get('tr').eq(0).should('have.attr', 'data-index', '0')
      cy.get('tr').eq(1).should('have.attr', 'data-index', '1')
    })
  })

  describe('TableBody', () => {
    it('renders rows when data is available', () => {
      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <TableBody
              table={mockTable as any}
              columnDefs={[{ id: 'col1' }, { id: 'col2' }]}
              isVirtualized={false}
              title="Test Data"
              activeFilterCount={0}
            />
          </table>
        </QueryClientProvider>
      )

      cy.get('tr').should('have.length', 2)
      cy.contains('No results').should('not.exist')
    })

    it('renders empty state when no data is available', () => {
      const emptyTable = {
        getRowModel: () => ({ rows: [] }),
      }

      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <TableBody
              table={emptyTable as any}
              columnDefs={[{ id: 'col1' }, { id: 'col2' }]}
              isVirtualized={false}
              title="Test Data"
              activeFilterCount={0}
            />
          </table>
        </QueryClientProvider>
      )

      cy.contains('No results').should('be.visible')
    })

    it('passes virtualization context correctly', () => {
      const mockVirtualizer = {
        getVirtualItems: () => [{ index: 0, size: 50, start: 0 }],
      }

      mount(
        <QueryClientProvider client={queryClient}>
          <table>
            <TableBody
              table={mockTable as any}
              columnDefs={[{ id: 'col1' }, { id: 'col2' }]}
              isVirtualized={true}
              virtualizer={mockVirtualizer as any}
              title="Test Data"
              activeFilterCount={0}
            />
          </table>
        </QueryClientProvider>
      )

      cy.get('tr').should('have.length', 1)
      cy.get('tr').should('have.attr', 'data-index', '0')
    })
  })
})
