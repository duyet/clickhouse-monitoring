import type { QueryConfig } from '@/types/query-config'

import { TableClient } from './table-client'

const mockQueryConfig: QueryConfig = {
  name: 'test-tables',
  sql: 'SELECT * FROM system.tables',
  columns: ['name', 'database', 'engine', 'rows'],
}

function mockTableResponse(body: unknown, statusCode = 200) {
  cy.intercept(
    { method: 'GET', url: '/api/v1/tables/test-tables*' },
    { statusCode, body }
  ).as('fetchTableData')
}

function mockCountingTableResponse(body: unknown) {
  let requestCount = 0

  cy.intercept({ method: 'GET', url: '/api/v1/tables/test-tables*' }, (req) => {
    requestCount += 1
    req.reply({ statusCode: 200, body })
  }).as('fetchTableData')

  return () => requestCount
}

describe('<TableClient />', () => {
  it('renders data table after data loads', () => {
    mockTableResponse({
      data: [
        { name: 'users', database: 'default', engine: 'MergeTree', rows: 1000 },
        {
          name: 'orders',
          database: 'default',
          engine: 'MergeTree',
          rows: 5000,
        },
      ],
      metadata: {
        queryId: 'test-query-id',
        duration: 0.1,
        rows: 2,
        host: 'localhost',
      },
    })

    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchTableData')
    cy.contains('Test Tables').should('be.visible')
    cy.contains('users').should('be.visible')
    cy.contains('orders').should('be.visible')
    cy.contains(/2 row\(s\) in 0\.10s/).should('be.visible')
  })

  it('shows capped result metadata when the API trims rows', () => {
    mockTableResponse({
      data: [
        { name: 'users', database: 'default', engine: 'MergeTree', rows: 1000 },
      ],
      metadata: {
        queryId: 'test-query-id',
        duration: 0.1,
        rows: 1000,
        host: 'localhost',
        resultRowLimit: 1000,
        resultOverflowMode: 'break',
        resultRowsBeforeCap: 1002,
        resultRowsTruncated: true,
      },
    })

    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchTableData')
    cy.contains('1,000 row(s) in 0.10s').should('be.visible')
    cy.contains('Capped').should('be.visible')
    cy.contains('1,002 before cap').should('be.visible')
  })

  it('displays error alert on API error', () => {
    mockTableResponse(
      {
        error: {
          type: 'query_error',
          message: 'Failed to execute query',
        },
      },
      500
    )

    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchTableData')
    cy.get('[role="alert"]').should(
      'have.attr',
      'aria-label',
      'Test Tables error'
    )
    cy.contains('Test Tables').should('be.visible')
  })

  it('renders table missing errors with docs link', () => {
    mockTableResponse(
      {
        error: {
          type: 'table_not_found',
          message: 'Required system table is missing',
        },
      },
      404
    )

    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchTableData')
    cy.get('[role="alert"]').should(
      'have.attr',
      'aria-label',
      'Test Tables unavailable'
    )
    cy.contains('Required system table is missing').should('be.visible')
    cy.contains('View ClickHouse documentation ↗')
      .should('be.visible')
      .and(
        'have.attr',
        'href',
        'https://clickhouse.com/docs/en/operations/system-tables'
      )
    cy.contains('Retry').should('not.exist')
  })

  it('displays no data alert when result is empty', () => {
    mockTableResponse({
      data: [],
      metadata: {
        queryId: 'test-query-id',
        duration: 0.05,
        rows: 0,
        host: 'localhost',
      },
    })

    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchTableData')
    cy.contains('Test Tables').should('be.visible')
    cy.contains('No data available for this query').should('be.visible')
  })

  it('supports custom description', () => {
    mockTableResponse({
      data: [
        { name: 'users', database: 'default', engine: 'MergeTree', rows: 1000 },
      ],
      metadata: {
        queryId: 'test-query-id',
        duration: 0.1,
        rows: 1,
        host: 'localhost',
      },
    })

    cy.mount(
      <TableClient
        title="Test Tables"
        description="All tables in the cluster"
        queryConfig={mockQueryConfig}
      />
    )

    cy.wait('@fetchTableData')
    cy.contains('All tables in the cluster').should('be.visible')
  })

  it('does not poll table data by default', () => {
    cy.clock()
    const getRequestCount = mockCountingTableResponse({
      data: [
        { name: 'users', database: 'default', engine: 'MergeTree', rows: 1000 },
      ],
      metadata: {
        queryId: 'test-query-id',
        duration: 0.1,
        rows: 1,
        host: 'localhost',
      },
    })

    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchTableData')
    cy.tick(31_000)
    cy.then(() => {
      expect(getRequestCount()).to.eq(1)
    })
  })

  // Quarantined: flaky under CI load — uses cy.clock()/cy.tick() to assert a 2nd
  // poll request fires, but the request intermittently doesn't occur within the
  // wait window (passed on PR runs, failed on a main run). Needs a more robust
  // fake-timer/poll assertion. See docs/knowledge/component-ci-stability.md.
  it.skip('polls table data when the query config opts in', () => {
    cy.clock()
    const getRequestCount = mockCountingTableResponse({
      data: [
        { name: 'users', database: 'default', engine: 'MergeTree', rows: 1000 },
      ],
      metadata: {
        queryId: 'test-query-id',
        duration: 0.1,
        rows: 1,
        host: 'localhost',
      },
    })

    cy.mount(
      <TableClient
        title="Test Tables"
        queryConfig={{ ...mockQueryConfig, refreshInterval: 30_000 }}
      />
    )

    cy.wait('@fetchTableData')
    cy.tick(31_000)
    cy.wait('@fetchTableData')
    cy.then(() => {
      expect(getRequestCount()).to.eq(2)
    })
  })
})
