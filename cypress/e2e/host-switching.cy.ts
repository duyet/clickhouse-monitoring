/**
 * @fileoverview Simplified E2E tests for host switching functionality
 * Tests to prevent regression of GitHub issue #509
 *
 * SIMPLIFIED APPROACH (PR #518 - Hybrid Fix):
 * - Tests focus on URL changes and element existence
 * - No data verification (Server Components don't support cy.intercept)
 * - Works with single ClickHouse instance in CI
 * - Architecture refactor will come in follow-up PR
 */

describe('Host Switching E2E Tests', () => {
  beforeEach(() => {
    // Visit the overview page directly (since /0 redirects to /0/overview)
    cy.visit('/0/overview', { timeout: 30000 })

    // Wait for page to load - host selector is the key element
    cy.get('[data-testid="host-selector"]', { timeout: 20000 }).should('exist')
  })

  it('should switch between hosts via URL navigation', () => {
    // Verify we're on host 0
    cy.url().should('include', '/0/overview')

    // Host selector should be present and functional
    cy.get('[data-testid="host-selector"]').should('exist').and('be.visible')

    // Switch to host 1 by clicking selector
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]', { timeout: 10000 }).should('be.visible').click()

    // Verify URL changed to host 1
    cy.url().should('include', '/1/overview')

    // Verify page elements still exist (basic rendering check)
    cy.get('[data-testid="host-selector"]').should('exist')

    // Switch back to host 0
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-0"]').should('be.visible').click()

    // Verify we're back on host 0
    cy.url().should('include', '/0/overview')
    cy.get('[data-testid="host-selector"]').should('exist')
  })

  it('should maintain host selection in URL across navigation', () => {
    // Switch to host 1
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]').should('be.visible').click()
    cy.url().should('include', '/1/overview')

    // Verify we can navigate and host persists in URL
    cy.visit('/1/clusters')
    cy.url().should('include', '/1/clusters')

    cy.visit('/1/database')
    cy.url().should('include', '/1/database')
  })
})

// Network request tests removed - cy.intercept() doesn't work with Server Components
// Data fetching happens on the server side, not client side
// These tests will be covered by integration tests in the architecture refactor

describe('Host Switching Basic Functionality', () => {
  it('should have functional host selector', () => {
    cy.visit('/0/overview', { timeout: 30000 })

    // Host selector should exist and be clickable
    cy.get('[data-testid="host-selector"]', { timeout: 20000 })
      .should('exist')
      .should('be.visible')
      .click()

    // Options should appear
    cy.get('[data-testid="host-option-1"]').should('be.visible').click()

    // URL should change
    cy.url().should('include', '/1/overview')
  })
})
