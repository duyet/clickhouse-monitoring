import { ChartContainer } from './chart-container'

describe('<ChartContainer />', () => {
  const mockChildren = cy.stub().returns(<div>Chart Content</div>)

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
      mutate: cy.stub().as('retry'),
      sql: undefined,
    }

    cy.mount(
      <ChartContainer swr={swr} title="Test Chart">
        {mockChildren}
      </ChartContainer>
    )

    cy.contains('Error').should('exist')
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

    cy.contains('No results').should('exist')
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

    const children = cy
      .stub()
      .returns(<div data-testid="chart-content">Chart Content</div>)

    cy.mount(
      <ChartContainer swr={swr} title="Test Chart">
        {children}
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

  it('applies custom chartClassName', () => {
    const swr = {
      data: [{ value: 42 }],
      isLoading: false,
      error: null,
      mutate: cy.stub(),
      sql: undefined,
    }

    cy.mount(
      <ChartContainer swr={swr} chartClassName="custom-chart-class">
        {mockChildren}
      </ChartContainer>
    )

    cy.get('.custom-chart-class').should('exist')
  })
})
