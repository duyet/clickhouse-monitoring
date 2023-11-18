Cypress.Commands.add(
  'visitAndValidate',
  (
    startRoute: string,
    clickOn: string,
    shouldMatchRoute?: string,
    shouldMatchTitle?: string
  ) => {
    // Start from the index page
    cy.visit(startRoute)

    // Find a link and click it
    cy.get(clickOn).click()

    // The new url should include shouldMatchRoute
    if (shouldMatchRoute) {
      cy.url().should('include', shouldMatchRoute)
    }

    // The new page should contain an h1 with title
    if (shouldMatchTitle) {
      cy.get('h1').contains(shouldMatchTitle.toLocaleLowerCase(), {
        matchCase: false,
      })
    }
  }
)
