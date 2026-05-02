import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { DataTableFooter } from './data-table-footer'

describe('<DataTableFooter />', () => {
  type Row = {
    col1: string
    col2: string
  }

  const columnHelper = createColumnHelper<Row>()

  const columns = [
    columnHelper.accessor('col1', {
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('col2', {
      cell: (info) => info.getValue(),
    }),
  ]

  function TestDataTableFooter({
    rows = data,
    pageSize = 10,
    footnote,
  }: {
    rows?: Row[]
    pageSize?: number
    footnote?: React.ComponentProps<typeof DataTableFooter<Row>>['footnote']
  }) {
    const table = useReactTable({
      data: rows,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize,
        },
      },
    })

    return <DataTableFooter table={table} footnote={footnote} />
  }

  const data: Row[] = [
    { col1: 'val1', col2: 'val1' },
    { col1: 'val2', col2: 'val2' },
    { col1: 'val3', col2: 'val3' },
  ]

  it('renders footer with default footnote', () => {
    cy.mount(<TestDataTableFooter />)

    cy.contains('0 of 3 row(s) selected').should('be.visible')
  })

  it('renders footer with custom text footnote', () => {
    cy.mount(<TestDataTableFooter footnote="Custom footnote text" />)

    cy.contains('Custom footnote text').should('be.visible')
    cy.contains('selected').should('not.exist')
  })

  it('renders footer with custom element footnote', () => {
    cy.mount(
      <TestDataTableFooter
        footnote={<div data-testid="custom-footnote">Custom Element</div>}
      />
    )

    cy.get('[data-testid="custom-footnote"]').should(
      'contain',
      'Custom Element'
    )
  })

  it('hides pagination when all rows fit on one page', () => {
    cy.mount(<TestDataTableFooter pageSize={10} />)

    cy.get('[aria-label="Pagination"]').should('not.exist')
  })

  it('shows pagination when rows span multiple pages', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    cy.mount(<TestDataTableFooter rows={largeData} pageSize={10} />)

    cy.get('[aria-label="Pagination"]').should('be.visible')
    cy.contains('1–10 of 25 rows').should('be.visible')
  })

  it('shows row count in footnote', () => {
    cy.mount(<TestDataTableFooter />)

    cy.contains('0 of 3 row(s) selected').should('be.visible')
  })

  it('renders footnote and pagination side by side', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    cy.mount(<TestDataTableFooter rows={largeData} pageSize={10} />)

    // Check that both elements exist and are in the same container
    cy.get('.flex.items-center.justify-between').should('be.visible')
    cy.contains('0 of 25 row(s) selected').should('be.visible')
    cy.get('[aria-label="Pagination"]').should('be.visible')
  })

  it('applies correct styling classes', () => {
    cy.mount(<TestDataTableFooter />)

    cy.get('.flex.shrink-0.items-center.justify-between').should('be.visible')
  })

  it('displays correct page information', () => {
    const largeData = Array.from({ length: 50 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    cy.mount(<TestDataTableFooter rows={largeData} pageSize={10} />)

    cy.contains('1–10 of 50 rows').should('be.visible')
    cy.contains('Rows per page').should('be.visible')
  })

  it('shows next page button enabled when not on last page', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    cy.mount(<TestDataTableFooter rows={largeData} pageSize={10} />)

    cy.get('button[aria-label="Go to next page"]').should('be.enabled')
  })

  it('shows previous page button disabled on first page', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    cy.mount(<TestDataTableFooter rows={largeData} pageSize={10} />)

    cy.get('button[aria-label="Go to previous page"]').should('be.disabled')
  })
})
