import { ChartSummaryUsedByMerges } from './summary-used-by-merges'

describe('<ChartSummaryUsedByMerges />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Summary - Used by Merges',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartSummaryUsedByMerges {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Summary - Used by Merges').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-merges*', {
      statusCode: 500,
      body: { error: { message: 'Database connection failed' } },
    }).as('chartError')

    cy.mount(<ChartSummaryUsedByMerges {...defaultProps} />)

    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-merges*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartSummaryUsedByMerges {...defaultProps} />)

    cy.wait('@chartEmpty')
    cy.contains('No results').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-merges*', {
      statusCode: 200,
      body: {
        data: [
          {
            used: [{ memory_usage: 1024000, readable_memory_usage: '1 MB' }],
            totalMem: [{ metric: 'memory', total: 17179869184, readable_total: '16 GB' }],
            rowsReadWritten: [
              {
                rows_read: 5000000,
                rows_written: 1000000,
                readable_rows_read: '5M',
                readable_rows_written: '1M',
              },
            ],
            bytesReadWritten: [
              {
                bytes_read: 1024000000,
                bytes_written: 512000000,
                readable_bytes_read: '1 GB',
                readable_bytes_written: '512 MB',
              },
            ],
          },
        ],
        metadata: {
          duration: 45,
          rows: 1,
          sql: 'SELECT ... FROM system.merges',
        },
      },
    }).as('chartData')

    cy.mount(<ChartSummaryUsedByMerges {...defaultProps} />)

    cy.wait('@chartData')
    cy.contains('rows read').should('exist')
    cy.contains('Total memory used by merges estimated').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartSummaryUsedByMerges {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-merges?hostId=1*', {
      statusCode: 200,
      body: {
        data: [
          {
            used: [{ memory_usage: 512000, readable_memory_usage: '512 KB' }],
            totalMem: [{ metric: 'memory', total: 8589934592, readable_total: '8 GB' }],
            rowsReadWritten: [
              {
                rows_read: 3000000,
                rows_written: 500000,
                readable_rows_read: '3M',
                readable_rows_written: '500K',
              },
            ],
            bytesReadWritten: [
              {
                bytes_read: 512000000,
                bytes_written: 256000000,
                readable_bytes_read: '512 MB',
                readable_bytes_written: '256 MB',
              },
            ],
          },
        ],
        metadata: { duration: 30, rows: 1 },
      },
    }).as('chartDataHost1')

    cy.mount(<ChartSummaryUsedByMerges hostId={1} title="Host 1 Merges" />)

    cy.wait('@chartDataHost1')
    cy.contains('Host 1 Merges').should('exist')
  })
})
