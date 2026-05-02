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
    cy.contains('Failed to Load Data').should('be.visible')
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
})
