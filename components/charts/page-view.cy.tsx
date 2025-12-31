import { PageViewBarChart } from './page-view'

describe('<PageViewBarChart />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Daily Page Views',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<PageViewBarChart {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Daily Page Views').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<PageViewBarChart {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Daily Page Views').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <PageViewBarChart {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<PageViewBarChart hostId={1} title="Host 1 Page Views" />)

    cy.contains('Host 1 Page Views').should('exist')
  })
})
