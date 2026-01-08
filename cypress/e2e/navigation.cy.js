/**
 * @fileoverview Navigation E2E tests - Simplified smoke tests
 * Tests the new static site architecture with ?host= query parameters
 */

describe('Navigation Smoke Tests', () => {
  it('should load overview page with query parameter', () => {
    cy.visit('/overview?host=0', { timeout: 30000 })
    cy.url().should('include', '/overview')
    cy.url().should('include', 'host=0')
    cy.get('body').should('contain', 'Overview')
  })

  it('should navigate between main pages', () => {
    const mainPages = ['/overview', '/dashboard', '/clusters', '/merges']

    mainPages.forEach((page) => {
      cy.visit(`${page}?host=0`, { timeout: 30000 })
      cy.url().should('include', page)
      cy.url().should('include', 'host=0')
      cy.get('body').should('exist')
    })
  })

  it('should handle direct URL navigation', () => {
    cy.visit('/running-queries?host=0', { timeout: 30000 })
    cy.url().should('include', '/running-queries')
    cy.url().should('include', 'host=0')
    cy.get('body').should('exist')
  })

  it('should maintain host parameter during browser navigation', () => {
    cy.visit('/dashboard?host=0', { timeout: 30000 })
    cy.url().should('include', 'host=0')

    cy.go('back')
    cy.url().should('include', 'host=0')

    cy.go('forward')
    cy.url().should('include', 'host=0')
    cy.url().should('include', '/dashboard')
  })
})
