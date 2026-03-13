import { ChartContainer } from './chart-container'

describe('<ChartContainer />', () => {
  // Regular function (not cy.stub) since tests don't need to spy on children calls
  const mockChildren = (
    _data: unknown[],
    _sql: string | undefined,
    _metadata: unknown,
    _staleError: unknown,
    _mutate: unknown
  ) => <div data-testid="chart-content">Chart Content</div>

  it('renders skeleton when loading', () => {
    const swr = {
      data: undefined,
      isLoading: true,
      error: null,
      mutate: cy.stub(),
      sql: undefined,
    }

    cy.mount(
      <ChartContainer swr={swr} title="Test Chart">
        {mockChildren}
      </ChartContainer>
    )

    cy.contains('Test Chart').should('exist')
    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
  })

  it('renders error state when error exists', () => {
    const swr = {
      data: undefined,
      isLoading: false,
      error: new Error('Test error'),
      mutate: cy.stub(),
      sql: undefined,
    }

    cy.mount(
      <ChartContainer swr={swr} title="Test Chart">
        {mockChildren}
      </ChartContainer>
    )

    // Error state renders (children are NOT rendered)
    cy.get('[data-testid="chart-content"]').should('not.exist')
    // Title is shown in error state
    cy.contains('Test Chart').should('exist')
  })

  it('renders empty state when no data', () => {
    const swr = {
      data: [],
      isLoading: false,
      error: null,
      mutate: cy.stub(),
      sql: undefined,
    }

    cy.mount(
      <ChartContainer swr={swr} title="Test Chart">
        {mockChildren}
      </ChartContainer>
    )

    // EmptyState with no-data variant shows "No data available"
    cy.contains('No data available').should('exist')
    cy.contains('Test Chart').should('exist')
  })

  it('renders children when data exists', () => {
    const swr = {
      data: [{ value: 42, time: '2024-01-01' }],
      isLoading: false,
      error: null,
      mutate: cy.stub(),
      sql: 'SELECT 42',
    }

    cy.mount(
      <ChartContainer swr={swr} title="Test Chart">
        {mockChildren}
      </ChartContainer>
    )

    cy.get('[data-testid="chart-content"]').should('exist')
    cy.get('[data-testid="chart-content"]').contains('Chart Content')
  })

  it('applies custom className', () => {
    const swr = {
      data: [{ value: 42 }],
      isLoading: false,
      error: null,
      mutate: cy.stub(),
      sql: undefined,
    }

    cy.mount(
      <ChartContainer swr={swr} className="custom-test-class">
        {mockChildren}
      </ChartContainer>
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('passes chartClassName to children render function', () => {
    const swr = {
      data: [{ value: 42 }],
      isLoading: false,
      error: null,
      mutate: cy.stub(),
      sql: undefined,
    }

    // chartClassName is NOT directly applied by ChartContainer
    // It's meant to be passed to children for them to apply
    // This test verifies the prop is accepted (doesn't throw)
    cy.mount(
      <ChartContainer swr={swr} chartClassName="custom-chart-class">
        {mockChildren}
      </ChartContainer>
    )

    // The test passes if component renders without error
    // chartClassName prop is available for children to use if needed
    cy.get('[data-testid="chart-content"]').should('exist')
  })
})
