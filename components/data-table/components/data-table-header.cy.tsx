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
        enableColumnFilters={false}
        activeFilterCount={0}
        clearAllColumnFilters={() => {}}
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

  it('shows filter clear button when filters are active', () => {
    cy.mount(
      <TestDataTableHeader enableColumnFilters={true} activeFilterCount={2} />
    )

    cy.contains('Clear 2 filters').should('be.visible')
  })

  it('shows singular filter text when one filter is active', () => {
    cy.mount(
      <TestDataTableHeader enableColumnFilters={true} activeFilterCount={1} />
    )

    cy.contains('Clear 1 filter').should('be.visible')
  })

  it('does not show filter clear button when no filters are active', () => {
    cy.mount(
      <TestDataTableHeader enableColumnFilters={true} activeFilterCount={0} />
    )

    cy.contains('Clear').should('not.exist')
  })

  it('calls clearAllColumnFilters when clear button is clicked', () => {
    const clearStub = cy.stub()

    cy.mount(
      <TestDataTableHeader
        enableColumnFilters={true}
        activeFilterCount={1}
        clearAllColumnFilters={clearStub}
      />
    )

    cy.contains('Clear 1 filter').click()
    cy.wrap(clearStub).should('have.been.calledOnce')
  })

  it('opens SQL dialog from request info menu', () => {
    cy.mount(<TestDataTableHeader showSQL={true} />)

    cy.get('button[aria-label="Open chart actions"]').click()
    cy.contains('[role="menuitem"]', 'Request Info').click()
    cy.get('pre').should('contain', 'SELECT * FROM test')
  })
})
