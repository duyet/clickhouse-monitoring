import { MetricCardSkeleton } from './skeleton'

describe('<MetricCardSkeleton />', () => {
  it('renders skeleton with title', () => {
    cy.mount(<MetricCardSkeleton title="Loading Metric" theme="default" />)

    cy.contains('Loading Metric').should('exist')
    cy.get('[aria-label="Loading Loading Metric"]').should('exist')
  })

  it('renders skeleton without title', () => {
    cy.mount(<MetricCardSkeleton />)

    // Should have loading state without specific title
    cy.get('[aria-label*="Loading"]').should('exist')
  })

  it('renders skeleton with description', () => {
    cy.mount(
      <MetricCardSkeleton
        title="Loading Metric"
        description="Loading data..."
      />
    )

    cy.contains('Loading Metric').should('exist')
    cy.contains('Loading data...').should('exist')
  })

  it('renders skeleton with icon', () => {
    cy.mount(
      <MetricCardSkeleton
        title="Loading Metric"
        icon={<div data-testid="skeleton-icon">Icon</div>}
      />
    )

    cy.get('[data-testid="skeleton-icon"]').should('exist')
  })

  it('renders skeleton with dual variant', () => {
    cy.mount(<MetricCardSkeleton title="Loading Metric" variant="dual" />)

    cy.contains('Loading Metric').should('exist')
    // Dual variant should show two skeleton bars
  })

  it('renders skeleton with trend variant', () => {
    cy.mount(<MetricCardSkeleton title="Loading Metric" variant="trend" />)

    cy.contains('Loading Metric').should('exist')
  })

  it('renders skeleton in compact mode', () => {
    cy.mount(<MetricCardSkeleton title="Loading Metric" compact />)

    cy.contains('Loading Metric').should('exist')
    cy.get('[aria-label="Loading Loading Metric"]').should('exist')
  })

  describe('themes', () => {
    const themes = [
      'default',
      'purple',
      'blue',
      'green',
      'orange',
      'pink',
      'cyan',
      'indigo',
    ] as const

    themes.forEach((theme) => {
      it(`renders skeleton with ${theme} theme`, () => {
        cy.mount(<MetricCardSkeleton title="Loading Metric" theme={theme} />)

        cy.contains('Loading Metric').should('exist')
      })
    })
  })

  it('applies custom className', () => {
    cy.mount(
      <MetricCardSkeleton
        title="Loading Metric"
        className="custom-skeleton-class"
      />
    )

    cy.get('.custom-skeleton-class').should('exist')
  })

  it('includes screen reader text', () => {
    cy.mount(<MetricCardSkeleton title="Loading Metric" />)

    cy.get('.sr-only')
      .contains('Loading Loading Metric data...')
      .should('exist')
  })
})
