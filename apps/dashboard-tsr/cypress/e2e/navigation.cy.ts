/// <reference types="cypress" />

/**
 * Navigation smoke tests for the static-site architecture (?host= query param).
 * Ported from the Next app; routes are identical under TanStack Start.
 */

describe('Navigation smoke tests', () => {
  it('loads the overview page with the host query parameter', () => {
    cy.visit('/overview?host=0')
    cy.url().should('include', '/overview')
    cy.url().should('include', 'host=0')
    cy.get('body').should('exist')
  })

  it('navigates between the main pages keeping ?host', () => {
    const mainPages = ['/overview', '/dashboard', '/clusters', '/merges']
    mainPages.forEach((page) => {
      cy.visit(`${page}?host=0`)
      cy.url().should('include', page)
      cy.url().should('include', 'host=0')
      cy.get('body').should('exist')
    })
  })

  it('handles direct URL navigation to a deep route', () => {
    cy.visit('/running-queries?host=0')
    cy.url().should('include', '/running-queries')
    cy.url().should('include', 'host=0')
    cy.get('body').should('exist')
  })

  it('preserves the host parameter across browser back/forward', () => {
    cy.visit('/overview?host=0')
    cy.visit('/dashboard?host=0')
    cy.url().should('include', 'host=0')

    cy.go('back')
    cy.url().should('include', '/overview')
    cy.url().should('include', 'host=0')

    cy.go('forward')
    cy.url().should('include', '/dashboard')
    cy.url().should('include', 'host=0')
  })
})
