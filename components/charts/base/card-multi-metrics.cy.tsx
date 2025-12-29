import { CardMultiMetrics } from './card-multi-metrics'

describe('<CardMultiMetrics />', () => {
  const mockItems = [
    {
      current: 100,
      target: 200,
      currentReadable: '100 users',
      targetReadable: '200 users',
    },
    {
      current: 50,
      target: 150,
      currentReadable: '50 sessions',
      targetReadable: '150 sessions',
    },
  ]

  it('renders with default props', () => {
    cy.mount(<CardMultiMetrics />)

    // Should have aria-description
    cy.get('[aria-description="card-metrics"]').should('exist')

    // Should not render labels when no items
    cy.contains('Current').should('not.exist')
    cy.contains('Total').should('not.exist')
  })

  it('renders with primary content', () => {
    cy.mount(<CardMultiMetrics primary="Dashboard Metrics" />)

    cy.get('div.text-xl').contains('Dashboard Metrics').should('be.visible')
  })

  it('renders with custom labels and items', () => {
    cy.mount(
      <CardMultiMetrics
        currentLabel="Active"
        targetLabel="Maximum"
        items={mockItems}
      />
    )

    // Labels should be visible when items exist
    cy.contains('Active').should('be.visible')
    cy.contains('Maximum').should('be.visible')
  })

  it('renders with items data', () => {
    cy.mount(<CardMultiMetrics items={mockItems} />)

    // Check if readable values are displayed
    cy.contains('100 users').should('be.visible')
    cy.contains('200 users').should('be.visible')
    cy.contains('50 sessions').should('be.visible')
    cy.contains('150 sessions').should('be.visible')

    // Check for dotted separators
    cy.get('hr.border-dotted').should('have.length', mockItems.length)
  })

  it('renders with custom className', () => {
    const customClass = 'custom-test-class'
    cy.mount(<CardMultiMetrics className={customClass} />)

    cy.get('[aria-description="card-metrics"]').should(
      'have.class',
      customClass
    )
  })

  it('renders with ReactNode as primary content', () => {
    cy.mount(
      <CardMultiMetrics
        primary={<div className="test-primary">Custom Primary</div>}
      />
    )

    cy.get('.test-primary').contains('Custom Primary').should('be.visible')
  })

  it('handles empty items array', () => {
    cy.mount(<CardMultiMetrics items={[]} />)

    // Should not render labels when items array is empty
    cy.contains('Current').should('not.exist')
    cy.contains('Total').should('not.exist')

    // Should not render any separators
    cy.get('hr.border-dotted').should('not.exist')
  })
})
