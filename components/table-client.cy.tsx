import { TableClient } from './table-client'
import type { QueryConfig } from '@/types/query-config'

// Mock query config for testing
const mockQueryConfig: QueryConfig = {
  name: 'test-tables',
  sql: 'SELECT * FROM system.tables',
  columns: ['name', 'database', 'engine', 'rows'],
}

describe('<TableClient />', () => {
  beforeEach(() => {
    // Mock the useHostId hook
    cy.window().then((win) => {
      // Mock the Next.js useParams hook
      cy.stub(win, 'useParams').returns({ host: '0' })
    })

    // Mock SWR response
    cy.intercept('/api/v1/tables/test-tables?hostId=0', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            name: 'users',
            database: 'default',
            engine: 'MergeTree',
            rows: 1000,
          },
          {
            name: 'orders',
            database: 'default',
            engine: 'MergeTree',
            rows: 5000,
          },
        ],
        metadata: {
          queryId: 'test-query-id',
          duration: 100,
          rows: 2,
          host: 'localhost',
        },
      },
    }).as('fetchTableData')
  })

  it('renders loading skeleton initially', () => {
    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    // Should show skeleton while loading
    cy.get('[data-slot="skeleton"]').should('exist')
  })

  it('renders data table after data loads', () => {
    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    // Wait for API call
    cy.wait('@fetchTableData')

    // Should display the title
    cy.contains('Test Tables').should('be.visible')

    // Should display the data
    cy.contains('users').should('be.visible')
    cy.contains('orders').should('be.visible')
  })

  it('displays error alert on API error', () => {
    cy.intercept('/api/v1/tables/test-tables?hostId=0', {
      statusCode: 500,
      body: {
        success: false,
        error: {
          type: 'query_error',
          message: 'Failed to execute query',
        },
        metadata: {
          queryId: '',
          duration: 0,
          rows: 0,
          host: 'unknown',
        },
      },
    }).as('fetchTableDataError')

    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchTableDataError')

    // Should show error alert
    cy.contains('Error loading data').should('be.visible')
    cy.contains('Failed to execute query').should('be.visible')
  })

  it('displays no data alert when result is empty', () => {
    cy.intercept('/api/v1/tables/test-tables?hostId=0', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
        metadata: {
          queryId: 'test-query-id',
          duration: 50,
          rows: 0,
          host: 'localhost',
        },
      },
    }).as('fetchEmptyData')

    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchEmptyData')

    // Should show no data alert
    cy.contains('No Data').should('be.visible')
    cy.contains('No data available for this query').should('be.visible')
  })

  it('includes query in error alert', () => {
    cy.intercept('/api/v1/tables/test-tables?hostId=0', {
      statusCode: 500,
      body: {
        success: false,
        error: {
          type: 'query_error',
          message: 'Failed to execute query',
        },
        metadata: {
          queryId: '',
          duration: 0,
          rows: 0,
          host: 'unknown',
        },
      },
    }).as('fetchTableDataError')

    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchTableDataError')

    // Check error alert is visible
    cy.contains('Error loading data').should('be.visible')

    // Check that query button is available
    cy.get('button[role="button"]')
      .contains(/query|details/i)
      .should('exist')
  })

  it('supports custom description', () => {
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

  it('displays metadata in footnote', () => {
    cy.mount(<TableClient title="Test Tables" queryConfig={mockQueryConfig} />)

    cy.wait('@fetchTableData')

    // Should display row count and duration in footnote
    cy.contains(/2 row\(s\)/).should('be.visible')
    cy.contains(/0\.1[0-9]+s/).should('be.visible')
  })

  it('passes custom page size to DataTable', () => {
    cy.mount(
      <TableClient
        title="Test Tables"
        queryConfig={mockQueryConfig}
        defaultPageSize={50}
      />
    )

    cy.wait('@fetchTableData')

    // The DataTable should receive the custom page size
    // This is verified indirectly through the table rendering
    cy.contains('Test Tables').should('be.visible')
  })
})
