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

  const createTable = (data: Row[], pageSize: number = 10) => {
    return useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize,
        },
      },
    })
  }

  const data: Row[] = [
    { col1: 'val1', col2: 'val1' },
    { col1: 'val2', col2: 'val2' },
    { col1: 'val3', col2: 'val3' },
  ]

  it('renders footer with default footnote', () => {
    const table = createTable(data)

    cy.mount(<DataTableFooter table={table} />)

    cy.contains('0 of 3 row(s) selected').should('be.visible')
  })

  it('renders footer with custom text footnote', () => {
    const table = createTable(data)

    cy.mount(<DataTableFooter table={table} footnote="Custom footnote text" />)

    cy.contains('Custom footnote text').should('be.visible')
    cy.contains('selected').should('not.exist')
  })

  it('renders footer with custom element footnote', () => {
    const table = createTable(data)

    cy.mount(
      <DataTableFooter
        table={table}
        footnote={<div data-testid="custom-footnote">Custom Element</div>}
      />
    )

    cy.get('[data-testid="custom-footnote"]').should(
      'contain',
      'Custom Element'
    )
  })

  it('hides pagination when all rows fit on one page', () => {
    const table = createTable(data, 10)

    cy.mount(<DataTableFooter table={table} />)

    cy.get('[aria-label="Pagination"]').should('not.exist')
  })

  it('shows pagination when rows span multiple pages', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    const table = createTable(largeData, 10)

    cy.mount(<DataTableFooter table={table} />)

    cy.get('[aria-label="Pagination"]').should('be.visible')
    cy.contains('Page 1 of 3').should('be.visible')
  })

  it('shows row count in footnote', () => {
    const table = createTable(data)

    cy.mount(<DataTableFooter table={table} />)

    cy.contains('0 of 3 row(s) selected').should('be.visible')
  })

  it('renders footnote and pagination side by side', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    const table = createTable(largeData, 10)

    cy.mount(<DataTableFooter table={table} />)

    // Check that both elements exist and are in the same container
    cy.get('.flex.items-center.justify-between').should('be.visible')
    cy.contains('0 of 25 row(s) selected').should('be.visible')
    cy.get('[aria-label="Pagination"]').should('be.visible')
  })

  it('applies correct styling classes', () => {
    const table = createTable(data)

    cy.mount(<DataTableFooter table={table} />)

    cy.get('.flex.shrink-0.items-center.justify-between').should('be.visible')
  })

  it('displays correct page information', () => {
    const largeData = Array.from({ length: 50 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    const table = createTable(largeData, 10)

    cy.mount(<DataTableFooter table={table} />)

    cy.contains('Page 1 of 5').should('be.visible')
    cy.contains('Rows per page').should('be.visible')
  })

  it('shows next page button enabled when not on last page', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    const table = createTable(largeData, 10)

    cy.mount(<DataTableFooter table={table} />)

    cy.get('button[aria-label="Go to next page"]').should('be.enabled')
  })

  it('shows previous page button disabled on first page', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      col1: `val${i}`,
      col2: `val${i}`,
    }))
    const table = createTable(largeData, 10)

    cy.mount(<DataTableFooter table={table} />)

    cy.get('button[aria-label="Go to previous page"]').should('be.disabled')
  })
})
