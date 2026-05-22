import {
  StandardTableRow,
  TableBody,
  TableBodyEmptyState,
  TableBodyRows,
  VirtualizedTableRow,
} from './table-body'

describe('TableBody Components', () => {
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
    getVisibleLeafColumns: () => [{ id: 'col1' }, { id: 'col2' }],
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
      cy.mount(
        <table>
          <tbody>
            <StandardTableRow row={mockRow as any} index={0} />
          </tbody>
        </table>
      )

      cy.get('tr').should('not.have.attr', 'data-state')
      cy.get('td').should('have.length', 2)
      cy.get('td').first().should('contain', 'Cell Value 1')
      cy.get('td').last().should('contain', 'Cell Value 2')
    })

    it('applies odd row styling for odd indices', () => {
      cy.mount(
        <table>
          <tbody>
            <StandardTableRow row={mockRow as any} index={1} />
          </tbody>
        </table>
      )

      cy.get('tr').should('have.class', 'odd:bg-muted/30')
    })

    it('applies selected state when row is selected', () => {
      const selectedRow = {
        ...mockRow,
        getIsSelected: () => true,
      }

      cy.mount(
        <table>
          <tbody>
            <StandardTableRow row={selectedRow as any} index={0} />
          </tbody>
        </table>
      )

      cy.get('tr').should('have.attr', 'data-state', 'selected')
    })

    it('allows standard cells to wrap long content', () => {
      cy.mount(
        <table>
          <tbody>
            <StandardTableRow row={mockRow as any} index={0} />
          </tbody>
        </table>
      )

      cy.get('td')
        .first()
        .should('have.class', 'break-words')
        .and('not.have.class', 'whitespace-nowrap')
    })
  })

  describe('VirtualizedTableRow', () => {
    it('renders a virtualized table row with positioning', () => {
      const virtualRow = { end: 50, index: 0, size: 50, start: 0 }

      cy.mount(
        <table>
          <tbody>
            <VirtualizedTableRow row={mockRow as any} virtualRow={virtualRow} />
          </tbody>
        </table>
      )

      cy.get('tr').should('have.attr', 'data-index', '0')
      cy.get('tr').should('have.attr', 'style').and('include', 'height: 50px')
      cy.get('tr').should('have.attr', 'style').and('not.include', 'translateY')
    })

    it('applies odd row styling for odd virtual row indices', () => {
      const virtualRow = { end: 100, index: 1, size: 50, start: 50 }

      cy.mount(
        <table>
          <tbody>
            <VirtualizedTableRow row={mockRow as any} virtualRow={virtualRow} />
          </tbody>
        </table>
      )

      cy.get('tr').should('have.class', 'odd:bg-muted/30')
    })

    it('keeps virtualized cells non-wrapping for stable row heights', () => {
      const virtualRow = { end: 50, index: 0, size: 50, start: 0 }

      cy.mount(
        <table>
          <tbody>
            <VirtualizedTableRow row={mockRow as any} virtualRow={virtualRow} />
          </tbody>
        </table>
      )

      cy.get('td')
        .first()
        .should('have.class', 'whitespace-nowrap')
        .and('not.have.class', 'break-words')
    })
  })

  describe('TableBodyEmptyState', () => {
    it('renders empty state with no filters message', () => {
      cy.mount(
        <table>
          <tbody>
            <TableBodyEmptyState
              columnDefs={[{ id: 'col1' }, { id: 'col2' }]}
              title="Test Data"
              activeFilterCount={0}
            />
          </tbody>
        </table>
      )

      cy.get('td').should('have.attr', 'colspan', '2')
      cy.get('[data-slot="empty"]').should('be.visible')
      cy.contains('No results').should('be.visible')
      cy.contains(/no test data found/i).should('be.visible')
    })

    it('renders empty state with active filters message', () => {
      cy.mount(
        <table>
          <tbody>
            <TableBodyEmptyState
              columnDefs={[{ id: 'col1' }, { id: 'col2' }]}
              title="Test Data"
              activeFilterCount={2}
            />
          </tbody>
        </table>
      )

      cy.get('[data-slot="empty-icon"]').should('be.visible')
      cy.contains(/no test data match your filters/i).should('be.visible')
      cy.contains(/clearing filters/i).should('be.visible')
    })
  })

  describe('TableBodyRows', () => {
    it('renders standard rows when not virtualized', () => {
      cy.mount(
        <table>
          <tbody>
            <TableBodyRows table={mockTable as any} isVirtualized={false} />
          </tbody>
        </table>
      )

      cy.get('tr').should('have.length', 2)
    })

    it('renders virtual rows when virtualized', () => {
      const mockVirtualizer = {
        getVirtualItems: () => [
          { end: 50, index: 0, size: 50, start: 0 },
          { end: 100, index: 1, size: 50, start: 50 },
        ],
        getTotalSize: () => 150,
      }

      cy.mount(
        <table>
          <tbody>
            <TableBodyRows
              table={mockTable as any}
              isVirtualized={true}
              virtualizer={mockVirtualizer as any}
            />
          </tbody>
        </table>
      )

      cy.get('tr[data-index]').should('have.length', 2)
      cy.get('tr[data-index]').eq(0).should('have.attr', 'data-index', '0')
      cy.get('tr[data-index]').eq(1).should('have.attr', 'data-index', '1')
      cy.get('[data-virtual-spacer="bottom"] td').should(
        'have.attr',
        'style',
        'height: 50px;'
      )
    })

    it('adds top and bottom spacer rows for scrolled virtual windows', () => {
      const mockVirtualizer = {
        getVirtualItems: () => [
          { end: 150, index: 1, size: 50, start: 100 },
          { end: 200, index: 999, size: 50, start: 150 },
        ],
        getTotalSize: () => 500,
      }

      cy.mount(
        <table>
          <tbody>
            <TableBodyRows
              table={mockTable as any}
              isVirtualized={true}
              virtualizer={mockVirtualizer as any}
            />
          </tbody>
        </table>
      )

      cy.get('[data-virtual-spacer="top"] td').should(
        'have.attr',
        'style',
        'height: 100px;'
      )
      cy.get('tr[data-index]').should('have.length', 1)
      cy.get('tr[data-index]').should('have.attr', 'data-index', '1')
      cy.get('[data-virtual-spacer="bottom"] td').should(
        'have.attr',
        'style',
        'height: 300px;'
      )
    })
  })

  describe('TableBody', () => {
    it('renders rows when data is available', () => {
      cy.mount(
        <table>
          <TableBody
            table={mockTable as any}
            columnDefs={[{ id: 'col1' }, { id: 'col2' }]}
            isVirtualized={false}
            title="Test Data"
            activeFilterCount={0}
          />
        </table>
      )

      cy.get('tr').should('have.length', 2)
      cy.contains('No results').should('not.exist')
    })

    it('renders empty state when no data is available', () => {
      const emptyTable = {
        getRowModel: () => ({ rows: [] }),
      }

      cy.mount(
        <table>
          <TableBody
            table={emptyTable as any}
            columnDefs={[{ id: 'col1' }, { id: 'col2' }]}
            isVirtualized={false}
            title="Test Data"
            activeFilterCount={0}
          />
        </table>
      )

      cy.contains('No results').should('be.visible')
    })

    it('passes virtualization context correctly', () => {
      const mockVirtualizer = {
        getVirtualItems: () => [{ end: 50, index: 0, size: 50, start: 0 }],
        getTotalSize: () => 50,
      }

      cy.mount(
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
      )

      cy.get('tr').should('have.length', 1)
      cy.get('tr').should('have.attr', 'data-index', '0')
    })
  })
})
