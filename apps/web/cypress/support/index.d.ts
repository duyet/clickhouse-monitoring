/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to visit a page and validate its title
     *
     * @example
     * cy.visitAndValidate('http://localhost:3000', 'a[href*="running-queries"]', '/running-queries', 'Running Queries')
     */
    visitAndValidate(
      root: string,
      clickOn: string,
      shouldMatchRoute?: string,
      shouldMatchTitle?: string
    ): Chainable
  }
}
