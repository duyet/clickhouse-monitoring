import { ChartMergeSumReadRows } from './merge-sum-read-rows'

describe('<ChartMergeSumReadRows />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Merge Sum Read Rows',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartMergeSumReadRows {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Merge Sum Read Rows').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartMergeSumReadRows {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Merge Sum Read Rows').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartMergeSumReadRows {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartMergeSumReadRows hostId={1} title="Host 1 Merge Read Rows" />)

    cy.contains('Host 1 Merge Read Rows').should('exist')
  })
})
