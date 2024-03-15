import { default as ErrorPage } from './error'

describe('<Error />', () => {
  it('renders', () => {
    const err = new Error('Test error')
    const reset = () => console.log('reset')

    // Render
    cy.mount(<ErrorPage error={err} reset={reset} />)

    cy.contains('Something went wrong').should('be.visible')

    // Check console.log was called
    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog')
      cy.get('button').contains('button', 'Try again').click()
      cy.get('@consoleLog')
        .should('have.been.called')
        .and('have.been.calledWith', 'reset')
    })
  })
})
