import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { QueryConfig } from '@/types/query-config'

import { DataTableContent } from './data-table-content'

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
    columnDefs: columns,
    tableContainerRef,
    isVirtualized: false,
    virtualizer: undefined,
    activeFilterCount: 0,
    enableColumnReordering: false,
  }

  function TestDataTableContent({
    rows = data,
    activeFilterCount = defaultProps.activeFilterCount,
    isVirtualized = defaultProps.isVirtualized,
    description = defaultProps.description,
    queryConfig: config = defaultProps.queryConfig,
  }: {
    rows?: Row[]
    activeFilterCount?: number
    isVirtualized?: boolean
    description?: string
    queryConfig?: QueryConfig
  }) {
    const table = useReactTable({
      data: rows,
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    return (
      <DataTableContent
        {...defaultProps}
        activeFilterCount={activeFilterCount}
        description={description}
        isVirtualized={isVirtualized}
        queryConfig={config}
        table={table}
      />
    )
  }

  it('renders table container with proper accessibility', () => {
    cy.mount(<TestDataTableContent />)

    cy.get('[role="region"]').should(
      'have.attr',
      'aria-label',
      'Test Table table'
    )
  })

  it('renders table with caption for accessibility', () => {
    cy.mount(<TestDataTableContent />)

    cy.get('#table-description.sr-only').should('contain', 'Test Description')
  })

  it('renders table with headers', () => {
    cy.mount(<TestDataTableContent />)

    cy.get('thead').should('exist')
    cy.get('th').should('have.length', 2)
  })

  it('renders table body with rows', () => {
    cy.mount(<TestDataTableContent />)

    cy.get('tbody').should('exist')
    cy.get('tbody tr').should('have.length', 3)
  })

  it('renders empty state when no data', () => {
    cy.mount(<TestDataTableContent rows={[]} />)

    cy.contains('No results').should('be.visible')
  })

  it('shows filter-related empty state message when filters are active', () => {
    cy.mount(<TestDataTableContent rows={[]} activeFilterCount={2} />)

    cy.contains('match your filters').should('be.visible')
  })

  it('shows standard empty state message when no filters active', () => {
    cy.mount(<TestDataTableContent rows={[]} activeFilterCount={0} />)

    cy.contains('adjusting your query').should('be.visible')
  })

  it('applies virtualization style when isVirtualized is true', () => {
    cy.mount(<TestDataTableContent isVirtualized={true} />)

    cy.get('[role="region"]')
      .should('have.css', 'height')
      .and('not.equal', 'auto')
  })

  it('does not apply fixed height when not virtualized', () => {
    cy.mount(<TestDataTableContent isVirtualized={false} />)

    // Height should be auto or not explicitly set to 600px
    cy.get('[role="region"]').should('not.have.css', 'height', '600px')
  })

  it('renders table with border and background styles', () => {
    cy.mount(<TestDataTableContent />)

    cy.get('[role="region"]')
      .should('have.class', 'border-border/50')
      .and('have.class', 'bg-card/30')
      .and('have.class', 'rounded-lg')
  })

  it('renders proper cell content', () => {
    cy.mount(<TestDataTableContent />)

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
      <TestDataTableContent description="" queryConfig={configWithDesc} />
    )

    cy.get('#table-description').should('contain', 'Config Description')
  })

  it('uses title as fallback for caption', () => {
    cy.mount(
      <TestDataTableContent
        description=""
        queryConfig={{ ...queryConfig, description: undefined }}
      />
    )

    cy.get('#table-description').should('contain', 'Test Table data table')
  })
})
