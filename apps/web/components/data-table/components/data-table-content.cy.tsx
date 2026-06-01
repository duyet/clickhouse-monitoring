import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
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
    enableColumnReordering = defaultProps.enableColumnReordering,
    onColumnOrderChange,
    virtualizer = defaultProps.virtualizer,
    columnVisibility,
    view,
    offerViewToggle,
    onViewChange,
  }: {
    rows?: Row[]
    activeFilterCount?: number
    isVirtualized?: boolean
    description?: string
    queryConfig?: QueryConfig
    enableColumnReordering?: boolean
    onColumnOrderChange?: (activeId: string, overId: string) => void
    virtualizer?: (typeof defaultProps)['virtualizer']
    columnVisibility?: Record<string, boolean>
    view?: 'table' | 'cards' | 'auto'
    offerViewToggle?: boolean
    onViewChange?: (view: 'table' | 'cards') => void
  }) {
    const table = useReactTable({
      data: rows,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      state: columnVisibility ? { columnVisibility } : undefined,
    })

    return (
      <DataTableContent
        {...defaultProps}
        activeFilterCount={activeFilterCount}
        description={description}
        enableColumnReordering={enableColumnReordering}
        isVirtualized={isVirtualized}
        onColumnOrderChange={onColumnOrderChange}
        queryConfig={config}
        table={table}
        virtualizer={virtualizer}
        view={view}
        offerViewToggle={offerViewToggle}
        onViewChange={onViewChange}
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
    cy.mount(<TestDataTableContent view="table" />)

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

  it('renders column reorder handles as shared icon buttons when enabled', () => {
    cy.mount(<TestDataTableContent enableColumnReordering={true} />)

    cy.get('button[aria-label="Drag to reorder col1 column"]')
      .should('have.attr', 'type', 'button')
      .and('have.class', 'size-6')
      .and('have.class', 'hidden')
      .and('have.class', 'sm:inline-flex')
      .find('[data-icon]')
      .should('exist')
    cy.get('button[aria-label="Drag to reorder col2 column"]').should('exist')
  })

  it('does not reorder columns on a plain drag-handle click', () => {
    const onColumnOrderChange = cy.stub().as('onColumnOrderChange')

    cy.mount(
      <TestDataTableContent
        enableColumnReordering={true}
        onColumnOrderChange={onColumnOrderChange}
      />
    )

    cy.get('button[aria-label="Drag to reorder col1 column"]').click({
      force: true,
    })

    cy.get('@onColumnOrderChange').should('not.have.been.called')
  })

  it('exposes sort controls in mobile card mode', () => {
    cy.viewport(375, 667)
    cy.mount(<TestDataTableContent />)

    cy.get('[data-testid="mobile-table-sort"]').should('be.visible').click()
    cy.contains('[role="menuitem"]', 'col1 ascending').should('be.visible')
    cy.contains('[role="menuitem"]', 'col1 descending').should('be.visible')
  })

  it('only shows visible columns in the mobile sort menu', () => {
    cy.viewport(375, 667)
    cy.mount(<TestDataTableContent columnVisibility={{ col2: false }} />)

    cy.get('[data-testid="mobile-table-sort"]').click()
    cy.contains('[role="menuitem"]', 'col1 ascending').should('be.visible')
    cy.contains('[role="menuitem"]', 'col2 ascending').should('not.exist')
  })

  it('virtualizes mobile cards when large result sets are virtualized', () => {
    cy.viewport(375, 667)

    const virtualizer = {
      getTotalSize: () => 90,
      getVirtualItems: () => [
        { end: 90, index: 1, key: 1, size: 90, start: 0 },
      ],
      measureElement: () => undefined,
    } as any

    cy.mount(
      <TestDataTableContent isVirtualized={true} virtualizer={virtualizer} />
    )

    cy.get('[data-testid="mobile-table-card"]').should('have.length', 1)
    cy.get('[data-testid="mobile-table-card"]').should('contain', 'val2')
  })

  it('forces the full table on mobile when the user picks table view', () => {
    // The bug this guards against: phones were stuck in cards because the
    // table/card split was CSS-breakpoint-only. With an explicit table choice
    // the real table must show even on a narrow viewport.
    cy.viewport(375, 667)
    cy.mount(<TestDataTableContent view="table" offerViewToggle={true} />)

    cy.get('table').should('be.visible')
    cy.get('[data-testid="mobile-table-card"]').should('not.be.visible')
  })

  it('keeps cards on mobile by default (auto)', () => {
    cy.viewport(375, 667)
    cy.mount(<TestDataTableContent view="auto" offerViewToggle={true} />)

    cy.get('[data-testid="mobile-table-card"]').should('be.visible')
    cy.get('table').should('not.be.visible')
  })
})
