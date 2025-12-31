import { ChartError } from './chart-error'

describe('<ChartError />', () => {
  const mockError = new Error('Test error message')
  const mockMutate = cy.stub().as('retry')

  it('renders error state with title', () => {
    cy.mount(<ChartError error={mockError} title="Test Chart" />)

    cy.contains('Error').should('exist')
    cy.contains('Test Chart').should('exist')
  })

  it('renders retry button when mutate is provided', () => {
    cy.mount(<ChartError error={mockError} title="Test Chart" onRetry={mockMutate} />)

    cy.contains('Retry').should('exist')
  })

  it('calls onRetry when retry button is clicked', () => {
    cy.mount(<ChartError error={mockError} title="Test Chart" onRetry={mockMutate} />)

    cy.contains('Retry').click()
    cy.get('@retry').should('have.been.called')
  })

  it('renders with custom className', () => {
    cy.mount(<ChartError error={mockError} title="Test Chart" className="custom-class" />)

    cy.get('.custom-class').should('exist')
  })

  it('has proper accessibility attributes', () => {
    cy.mount(<ChartError error={mockError} title="Test Chart" />)

    cy.get('[role="alert"]').should('exist')
  })
})
