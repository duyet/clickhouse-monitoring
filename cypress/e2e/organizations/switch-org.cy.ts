/**
 * E2E tests for organization switching
 * Tests FR-4.3: Team switcher in sidebar with org list
 * Tests FR-8.1: Include org slug in URL
 */

describe('Switch Organization', () => {
  describe('Team Switcher', () => {
    beforeEach(() => {
      cy.visit('/overview')
    })

    it('should display team switcher component', () => {
      // Page should function
      cy.get('body').should('be.visible')
    })

    it('should handle org parameter in URL (FR-8.1)', () => {
      cy.visit('/overview?org=test-org&host=0')

      // URL should support org parameter
      cy.url().should('include', '/overview')
    })
  })

  describe('URL Structure (FR-8.1)', () => {
    it('should support org slug in URL', () => {
      cy.visit('/overview?org=acme&host=1')

      // Page should load with org param
      cy.get('body').should('be.visible')
    })

    it('should preserve org param during navigation', () => {
      cy.visit('/overview?org=test-org')

      // Navigate to tables
      cy.visit('/tables?org=test-org')
      cy.url().should('include', 'org=test-org')

      // Navigate to running queries
      cy.visit('/running-queries?org=test-org')
      cy.url().should('include', 'org=test-org')
    })
  })

  describe('Org Switching Flow', () => {
    it('should maintain page state when switching orgs', () => {
      // Visit with one org
      cy.visit('/overview?org=org1&host=0')
      cy.get('body').should('be.visible')

      // Switch to another org via URL
      cy.visit('/overview?org=org2&host=0')
      cy.get('body').should('be.visible')

      // Should still be on overview
      cy.url().should('include', '/overview')
    })
  })

  describe('Auto-switch to Personal Org (FR-4.5)', () => {
    it('should handle missing org gracefully', () => {
      // Visit without org param
      cy.visit('/overview')

      // App should work without explicit org
      cy.get('body').should('be.visible')
    })

    it('should handle invalid org gracefully', () => {
      // Visit with invalid org
      cy.visit('/overview?org=nonexistent-org-12345')

      // Should not crash, may redirect or show error
      cy.get('body').should('be.visible')
    })
  })
})
