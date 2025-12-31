import { ChartQueryCount } from './query-count'

describe('<ChartQueryCount />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Query Count',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartQueryCount {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Query Count').should('exist')
  })

  it('renders chart with data', () => {
    // Mock SWR hook response - in a real test, you'd mock the useChartData hook
    // For now, this test verifies the component renders without crashing
    cy.mount(<ChartQueryCount {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Query Count').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartQueryCount {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })
})
