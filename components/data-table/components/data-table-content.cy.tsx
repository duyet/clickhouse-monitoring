import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { DataTableContent } from './data-table-content'
import type { QueryConfig } from '@/types/query-config'

describe('<DataTableContent />', () => {
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

  const data: Row[] = [
    { col1: 'val1', col2: 'val1' },
    { col1: 'val2', col2: 'val2' },
    { col1: 'val3', col2: 'val3' },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const queryConfig: QueryConfig = {
    name: 'test-table',
    sql: 'SELECT * FROM test',
    columns: ['col1', 'col2'],
  }

  const tableContainerRef = { current: null }

  const defaultProps = {
    title: 'Test Table',
    description: 'Test Description',
    queryConfig,
    table,
    columnDefs: columns,
    tableContainerRef,
    isVirtualized: false,
    virtualizer: undefined,
    activeFilterCount: 0,
  }

  it('renders table container with proper accessibility', () => {
    cy.mount(<DataTableContent {...defaultProps} />)

    cy.get('[role="region"]')
      .should('have.attr', 'aria-label', 'Test Table table')
  })

  it('renders table with caption for accessibility', () => {
    cy.mount(<DataTableContent {...defaultProps} />)

    cy.get('#table-description.sr-only').should('contain', 'Test Description')
  })

  it('renders table with headers', () => {
    cy.mount(<DataTableContent {...defaultProps} />)

    cy.get('thead').should('exist')
    cy.get('th').should('have.length', 2)
  })

  it('renders table body with rows', () => {
    cy.mount(<DataTableContent {...defaultProps} />)

    cy.get('tbody').should('exist')
    cy.get('tbody tr').should('have.length', 3)
  })

  it('renders empty state when no data', () => {
    const emptyTable = useReactTable({
      data: [],
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    cy.mount(
      <DataTableContent
        {...defaultProps}
        table={emptyTable}
      />
    )

    cy.contains('No results').should('be.visible')
  })

  it('shows filter-related empty state message when filters are active', () => {
    const emptyTable = useReactTable({
      data: [],
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    cy.mount(
      <DataTableContent
        {...defaultProps}
        table={emptyTable}
        activeFilterCount={2}
      />
    )

    cy.contains('match your filters').should('be.visible')
  })

  it('shows standard empty state message when no filters active', () => {
    const emptyTable = useReactTable({
      data: [],
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    cy.mount(
      <DataTableContent
        {...defaultProps}
        table={emptyTable}
        activeFilterCount={0}
      />
    )

    cy.contains('adjusting your query').should('be.visible')
  })

  it('applies virtualization style when isVirtualized is true', () => {
    cy.mount(
      <DataTableContent
        {...defaultProps}
        isVirtualized={true}
      />
    )

    cy.get('[role="region"]')
      .should('have.css', 'height')
      .and('not.equal', 'auto')
  })

  it('does not apply fixed height when not virtualized', () => {
    cy.mount(
      <DataTableContent
        {...defaultProps}
        isVirtualized={false}
      />
    )

    // Height should be auto or not explicitly set to 600px
    cy.get('[role="region"]')
      .should('not.have.css', 'height', '600px')
  })

  it('renders table with border and background styles', () => {
    cy.mount(<DataTableContent {...defaultProps} />)

    cy.get('[role="region"]')
      .should('have.class', 'border-border\\/50')
      .and('have.class', 'bg-card\\/30')
      .and('have.class', 'rounded-lg')
  })

  it('renders proper cell content', () => {
    cy.mount(<DataTableContent {...defaultProps} />)

    cy.get('tbody tr').eq(0).find('td').eq(0).should('contain', 'val1')
    cy.get('tbody tr').eq(0).find('td').eq(1).should('contain', 'val1')
    cy.get('tbody tr').eq(1).find('td').eq(0).should('contain', 'val2')
  })

  it('uses queryConfig description when description not provided', () => {
    const configWithDesc: QueryConfig = {
      ...queryConfig,
      description: 'Config Description',
    }

    cy.mount(
      <DataTableContent
        {...defaultProps}
        description=""
        queryConfig={configWithDesc}
      />
    )

    cy.get('#table-description').should('contain', 'Config Description')
  })

  it('uses title as fallback for caption', () => {
    cy.mount(
      <DataTableContent
        {...defaultProps}
        description=""
        queryConfig={{ ...queryConfig, description: undefined }}
      />
    )

    cy.get('#table-description').should('contain', 'Test Table data table')
  })
})
