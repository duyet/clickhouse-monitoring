import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { QueryConfig } from '@/types/query-config'

import { DataTableHeader } from './data-table-header'

describe('<DataTableHeader />', () => {
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
  ]

  const queryConfig: QueryConfig = {
    name: 'test-table',
    sql: 'SELECT * FROM test',
    columns: ['col1', 'col2'],
  }

  function TestDataTableHeader(
    props: Partial<React.ComponentProps<typeof DataTableHeader>>
  ) {
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    return (
      <DataTableHeader
        title="Test Table"
        description="Test Description"
        queryConfig={queryConfig}
        table={table}
        showSQL
        isRefreshing={false}
        globalSearch=""
        onGlobalSearchChange={() => {}}
        advancedFilters={[]}
        onAdvancedFiltersChange={() => {}}
        {...props}
      />
    )
  }

  it('renders header with title and description', () => {
    cy.mount(<TestDataTableHeader />)

    cy.get('h1').contains('Test Table')
    cy.get('p').contains('Test Description')
  })

  it('renders header with queryConfig description when description not provided', () => {
    const configWithDesc: QueryConfig = {
      ...queryConfig,
      description: 'Config Description',
    }

    cy.mount(
      <TestDataTableHeader description="" queryConfig={configWithDesc} />
    )

    cy.get('p').contains('Config Description')
  })

  it('shows loading indicator when isRefreshing is true', () => {
    cy.mount(<TestDataTableHeader isRefreshing={true} />)

    cy.get('[aria-label="Loading data"]').should('be.visible')
    cy.get('.animate-spin').should('exist')
  })

  it('does not show loading indicator when isRefreshing is false', () => {
    cy.mount(<TestDataTableHeader isRefreshing={false} />)

    cy.get('[aria-label="Loading data"]').should('not.exist')
  })

  it('shows request info menu when showSQL is true', () => {
    cy.mount(<TestDataTableHeader showSQL={true} />)

    cy.get('button[aria-label="Open chart actions"]').should('exist')
  })

  it('does not show request info menu when showSQL is false', () => {
    cy.mount(<TestDataTableHeader showSQL={false} />)

    cy.get('button[aria-label="Open chart actions"]').should('not.exist')
  })

  it('shows Column Options button', () => {
    cy.mount(<TestDataTableHeader />)

    cy.get('button[aria-label="Column Options"]').should('exist')
  })

  it('renders toolbar extras when provided', () => {
    cy.mount(
      <TestDataTableHeader
        toolbarExtras={<span data-testid="toolbar-extra">Extra</span>}
      />
    )

    cy.get('[data-testid="toolbar-extra"]').contains('Extra')
  })

  it('renders top right toolbar extras when provided', () => {
    cy.mount(
      <TestDataTableHeader
        topRightToolbarExtras={
          <span data-testid="right-extra">Right Extra</span>
        }
      />
    )

    cy.get('[data-testid="right-extra"]').contains('Right Extra')
  })

  it('shows filter chips when advanced filters are active', () => {
    cy.mount(
      <TestDataTableHeader
        advancedFilters={[
          {
            id: '1',
            columnId: 'col1',
            operator: 'contains',
            value: 'test',
          },
        ]}
      />
    )

    cy.contains('col1 contains “test”').should('be.visible')
    cy.contains('Clear all').should('be.visible')
  })

  it('does not show filter chips when no filters are active', () => {
    cy.mount(<TestDataTableHeader advancedFilters={[]} />)

    cy.contains('Clear all').should('not.exist')
  })

  it('calls onAdvancedFiltersChange when a filter chip is deleted', () => {
    const filterChangeStub = cy.stub()

    cy.mount(
      <TestDataTableHeader
        advancedFilters={[
          {
            id: '1',
            columnId: 'col1',
            operator: 'contains',
            value: 'test',
          },
        ]}
        onAdvancedFiltersChange={filterChangeStub}
      />
    )

    cy.get('button[aria-label="Remove col1 filter"]').click()
    cy.wrap(filterChangeStub).should('have.been.calledOnce')
  })

  it('calls clearAllFilters when Clear all button is clicked', () => {
    const filterChangeStub = cy.stub()
    const globalSearchChangeStub = cy.stub()

    cy.mount(
      <TestDataTableHeader
        advancedFilters={[
          {
            id: '1',
            columnId: 'col1',
            operator: 'contains',
            value: 'test',
          },
        ]}
        onAdvancedFiltersChange={filterChangeStub}
        onGlobalSearchChange={globalSearchChangeStub}
      />
    )

    cy.contains('Clear all').click()
    cy.wrap(filterChangeStub).should('have.been.calledWith', [])
    cy.wrap(globalSearchChangeStub).should('have.been.calledWith', '')
  })

  it('opens SQL dialog from request info menu', () => {
    cy.mount(<TestDataTableHeader showSQL={true} />)

    cy.get('button[aria-label="Open chart actions"]').click()
    cy.contains('[role="menuitem"]', 'Request Info').click()
    cy.get('pre').should('contain', 'SELECT').and('contain', 'FROM')
  })

  it('does not offer the synthetic action column in advanced filters', () => {
    type ActionRow = {
      action: string
      query: string
    }

    const actionColumnHelper = createColumnHelper<ActionRow>()
    const actionColumns = [
      actionColumnHelper.accessor('action', {
        header: 'action',
        cell: () => 'Actions',
      }),
      actionColumnHelper.accessor('query', {
        cell: (info) => info.getValue(),
      }),
    ]

    const actionData: ActionRow[] = [{ action: 'open', query: 'SELECT 1' }]

    function ActionTableHeader() {
      const table = useReactTable({
        data: actionData,
        columns: actionColumns,
        getCoreRowModel: getCoreRowModel(),
      })

      return (
        <DataTableHeader
          title="Action Table"
          description="Action filter test"
          queryConfig={{
            name: 'action-table',
            sql: 'SELECT 1',
            columns: ['action', 'query'],
          }}
          table={table}
          showSQL={false}
          isRefreshing={false}
          globalSearch=""
          onGlobalSearchChange={() => {}}
          advancedFilters={[]}
          onAdvancedFiltersChange={() => {}}
        />
      )
    }

    cy.mount(<ActionTableHeader />)

    cy.contains('button', 'Filters').click()
    // Radix Select mounts its options lazily — open the column select first.
    // Use cy.contains('button', ...) to target the <button> itself, not the
    // inner <span> which has pointer-events: none.
    cy.contains('button', 'query').click()
    cy.get('[role="option"]').should('contain.text', 'query')
    cy.get('[role="option"]').should('not.contain.text', 'action')
  })

  it('offers a view toggle when opted in and reflects it to the caller', () => {
    const onViewChange = cy.stub().as('onViewChange')
    cy.mount(
      <TestDataTableHeader
        view="auto"
        offerViewToggle={true}
        onViewChange={onViewChange}
      />
    )

    cy.get('[role="group"][aria-label="Result view"]').should('be.visible')
    cy.contains('button', 'Cards').click()
    cy.get('@onViewChange').should('have.been.calledWith', 'cards')
  })
})
