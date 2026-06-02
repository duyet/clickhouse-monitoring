import { ChartError } from './chart-error'

describe('<ChartError />', () => {
  const mockError = new Error('Test error message')
  const retryableError = new Error('Network timeout')

  it('renders error state with title', () => {
    cy.mount(<ChartError error={mockError} title="Test Chart" />)

    cy.contains('Test Chart').should('exist')
    cy.contains('An unexpected error occurred').should('exist')
  })

  it('renders retry button when mutate is provided', () => {
    const mockMutate = cy.stub().as('retry')

    cy.mount(
      <ChartError
        error={retryableError}
        title="Test Chart"
        onRetry={mockMutate}
      />
    )

    cy.contains('Retry').should('exist')
  })

  it('calls onRetry when retry button is clicked', () => {
    const mockMutate = cy.stub().as('retry')

    cy.mount(
      <ChartError
        error={retryableError}
        title="Test Chart"
        onRetry={mockMutate}
      />
    )

    cy.contains('Retry').click()
    cy.get('@retry').should('have.been.called')
  })

  it('renders with custom className', () => {
    cy.mount(
      <ChartError
        error={mockError}
        title="Test Chart"
        className="custom-class"
      />
    )

    cy.get('.custom-class').should('exist')
  })

  it('has proper accessibility attributes', () => {
    cy.mount(<ChartError error={mockError} title="Test Chart" />)

    cy.get('[role="alert"]').should('exist')
  })
})
