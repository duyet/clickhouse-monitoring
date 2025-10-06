import { default as ErrorPage } from './error'

describe('<Error />', () => {
  it('renders error with message', () => {
    const err = new Error('Test error message')
    const reset = () => console.log('reset')

    // Render
    cy.mount(<ErrorPage error={err} reset={reset} />)

    // Should show error title (environment-dependent)
    cy.get('[data-testid="error-message"]').should('be.visible')

    // Should show the error message
    cy.contains('Test error message').should('be.visible')

    // Should show Try again button
    cy.get('button').contains('Try again').should('be.visible')
  })

  it('renders error with digest', () => {
    const err = Object.assign(new Error('Test error'), {
      digest: 'abc123xyz',
    })
    const reset = () => {}

    cy.mount(<ErrorPage error={err} reset={reset} />)

    // Should show error digest for tracking
    cy.contains('Error ID').should('be.visible')
    cy.contains('abc123xyz').should('be.visible')
  })

  it('allows reset action', () => {
    const err = new Error('Test error')
    const reset = cy.stub().as('resetStub')

    cy.mount(<ErrorPage error={err} reset={reset} />)

    cy.get('button').contains('Try again').click()
    cy.get('@resetStub').should('have.been.called')
  })

  it('logs error on mount', () => {
    const err = new Error('Test error for logging')
    const reset = () => {}

    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError')
      cy.mount(<ErrorPage error={err} reset={reset} />)

      // Wait for useEffect to run
      cy.wait(100)
      cy.get('@consoleError').should('have.been.called')
    })
  })
})
