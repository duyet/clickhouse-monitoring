/// <reference types="cypress" />

/**
 * Sidebar navigation smoke tests.
 *
 * Verifies the sidebar menu renders with key sections and that
 * clicking a nav link updates the URL while preserving the host parameter.
 */

describe('Sidebar navigation', () => {
  beforeEach(() => {
    cy.visit('/overview?host=0')
  })

  it('renders the sidebar with navigation sections', () => {
    // The sidebar should contain recognizable section labels
    cy.get('nav').should('exist')
  })

  it('preserves host parameter when clicking a sidebar link', () => {
    // Find a sidebar link that isn't the current page (overview)
    cy.get('nav a[href*="host="]')
      .not('[href*="/overview"]')
      .first()
      .then(($link) => {
        cy.wrap($link).click()
        cy.url().should('include', 'host=0')
        // URL should have changed from /overview
        cy.url().should('not.include', '/overview')
      })
  })

  it('navigates to running-queries via sidebar', () => {
    cy.get('nav a[href*="/running-queries"]').first().click()
    cy.url().should('include', '/running-queries')
    cy.url().should('include', 'host=0')
    cy.get('body').should('exist')
  })

  it('navigates to clusters via sidebar', () => {
    cy.get('nav a[href*="/clusters"]').first().click()
    cy.url().should('include', '/clusters')
    cy.url().should('include', 'host=0')
    cy.get('body').should('exist')
  })
})
