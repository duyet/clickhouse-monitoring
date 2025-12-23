/**
 * @fileoverview Simplified E2E tests for host switching functionality
 * Tests to prevent regression of GitHub issue #509
 *
 * SIMPLIFIED APPROACH (PR #518 - Hybrid Fix):
 * - Tests focus on URL changes and element existence
 * - No data verification (Server Components don't support cy.intercept)
 * - Adapts to single or multi-host environment
 * - Architecture refactor will come in follow-up PR
 */

describe('Host Switching E2E Tests', () => {
  let isMultiHost = false

  before(() => {
    // Check if multi-host environment by visiting overview and checking for selector
    cy.visit('/0/overview', { timeout: 30000 })
    cy.get('body', { timeout: 20000 }).then(($body) => {
      isMultiHost = $body.find('[data-testid="host-selector"]').length > 0
      cy.log(`Multi-host environment: ${isMultiHost}`)
    })
  })

  beforeEach(() => {
    cy.visit('/0/overview', { timeout: 30000 })
    // Wait for page to load
    cy.get('body', { timeout: 20000 }).should('exist')
  })

  it('should switch between hosts via URL navigation', function () {
    if (!isMultiHost) {
      cy.log('Skipping: Single host environment detected')
      this.skip()
    }

    // Verify we're on host 0
    cy.url().should('include', '/0/overview')

    // Host selector should be present and functional
    cy.get('[data-testid="host-selector"]', { timeout: 10000 }).should('exist').and('be.visible')

    // Switch to host 1 by clicking selector - use force: true for Radix UI Select
    cy.get('[data-testid="host-selector"]').click({ force: true })
    cy.get('[data-testid="host-option-1"]', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true })

    // Verify URL changed to host 1
    cy.url().should('include', '/1/overview')

    // Verify page elements still exist (basic rendering check)
    cy.get('[data-testid="host-selector"]').should('exist')

    // Switch back to host 0
    cy.get('[data-testid="host-selector"]').click({ force: true })
    cy.get('[data-testid="host-option-0"]').should('be.visible').click({ force: true })

    // Verify we're back on host 0
    cy.url().should('include', '/0/overview')
    cy.get('[data-testid="host-selector"]').should('exist')
  })

  it('should maintain host selection in URL across navigation', function () {
    if (!isMultiHost) {
      cy.log('Skipping: Single host environment detected')
      this.skip()
    }

    // Switch to host 1
    cy.get('[data-testid="host-selector"]', { timeout: 10000 }).click({ force: true })
    cy.get('[data-testid="host-option-1"]').should('be.visible').click({ force: true })
    cy.url().should('include', '/1/overview')

    // Verify we can navigate and host persists in URL
    cy.visit('/1/clusters', { timeout: 30000 })
    cy.url().should('include', '/1/clusters')

    cy.visit('/1/database', { timeout: 30000 })
    cy.url().should('include', '/1/database')
  })

  it('should display page correctly in single-host environment', function () {
    if (isMultiHost) {
      cy.log('Skipping: Multi-host environment detected')
      this.skip()
    }

    // In single-host mode, just verify the page loads and displays content
    cy.url().should('include', '/0/overview')

    // Verify basic page elements exist
    cy.get('body').should('contain', 'Overview')

    // Can navigate to other pages with host in URL
    cy.visit('/0/clusters', { timeout: 30000 })
    cy.url().should('include', '/0/clusters')
  })
})

// Network request tests removed - cy.intercept() doesn't work with Server Components
// Data fetching happens on the server side, not client side
// These tests will be covered by integration tests in the architecture refactor

describe('Host Switching Basic Functionality', () => {
  it('should have functional host selector when multi-host is configured', () => {
    cy.visit('/0/overview', { timeout: 30000 })

    // Check if selector exists (multi-host environment)
    cy.get('body', { timeout: 20000 }).then(($body) => {
      if ($body.find('[data-testid="host-selector"]').length > 0) {
        // Multi-host environment - test selector functionality
        cy.get('[data-testid="host-selector"]', { timeout: 20000 })
          .should('exist')
          .should('be.visible')
          .click({ force: true })

        // Options should appear
        cy.get('[data-testid="host-option-1"]', { timeout: 10000 }).should('be.visible').click({ force: true })

        // URL should change
        cy.url().should('include', '/1/overview')
      } else {
        // Single-host environment - just verify page loads
        cy.log('Single host environment - selector not expected')
        cy.url().should('include', '/0/overview')
      }
    })
  })
})
