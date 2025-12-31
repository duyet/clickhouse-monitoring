import { ChartTopTableSize } from './top-table-size'

describe('<ChartTopTableSize />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Top Tables by Size',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartTopTableSize {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Top Tables by Size').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/top-table-size*', {
      statusCode: 500,
      body: { error: { message: 'Database connection failed' } },
    }).as('chartError')

    cy.mount(<ChartTopTableSize {...defaultProps} />)

    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/top-table-size*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartTopTableSize {...defaultProps} />)

    cy.wait('@chartEmpty')
    cy.contains('No results').should('exist')
  })

  it('renders chart with tabs for by-size and by-count', () => {
    cy.intercept('GET', '/api/v1/charts/top-table-size*', {
      statusCode: 200,
      body: {
        data: [
          {
            table: 'system.query_log',
            compressed_bytes: 1024000,
            uncompressed_bytes: 5120000,
            compressed: '1 MB',
            uncompressed: '5 MB',
            compr_rate: 0.2,
            total_rows: 100000,
            readable_total_rows: '100K',
            part_count: 10,
          },
        ],
        metadata: {
          duration: 45,
          rows: 1,
          sql: 'SELECT ... FROM system.parts',
        },
      },
    }).as('chartData')

    cy.mount(<ChartTopTableSize {...defaultProps} />)

    cy.wait('@chartData')

    // Check tabs are present
    cy.contains('Top tables by Size').should('exist')
    cy.contains('Top tables by Row Count').should('exist')

    // Default tab should be "by-size"
    cy.contains('system.query_log').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartTopTableSize {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/top-table-size?hostId=1*', {
      statusCode: 200,
      body: {
        data: [
          {
            table: 'another.table',
            compressed_bytes: 2048000,
            uncompressed_bytes: 10240000,
            compressed: '2 MB',
            uncompressed: '10 MB',
            compr_rate: 0.2,
            total_rows: 200000,
            readable_total_rows: '200K',
            part_count: 20,
          },
        ],
        metadata: { duration: 30, rows: 1 },
      },
    }).as('chartDataHost1')

    cy.mount(<ChartTopTableSize hostId={1} title="Host 1 Top Tables" />)

    cy.wait('@chartDataHost1')
    cy.contains('Host 1 Top Tables').should('exist')
  })
})
