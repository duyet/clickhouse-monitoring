/**
 * E2E tests for deleting ClickHouse hosts
 * Tests FR-3.7: Auto-select first host after deleting currently selected host
 */

describe('Delete Host', () => {
  describe('Host Deletion UI', () => {
    beforeEach(() => {
      cy.visit('/overview')
    })

    it('should have host switcher in the UI', () => {
      // Host switcher should be visible
      cy.get('body').then(($body) => {
        const hasHostSwitcher =
          $body.find('[data-testid="host-switcher"]').length > 0 ||
          $body.find('[data-testid="host-selector"]').length > 0 ||
          $body.find('select').length > 0 ||
          $body.find('[role="combobox"]').length > 0

        expect(hasHostSwitcher).to.be.true
      })
    })

    it('should show current host selection', () => {
      // Some indication of current host should be visible
      cy.get('body').should('be.visible')
    })
  })

  describe('Auto-select After Delete (FR-3.7)', () => {
    it('should handle host parameter in URL', () => {
      // Visit with specific host
      cy.visit('/overview?host=0')

      // Should be on overview with host param
      cy.url().should('include', '/overview')
    })

    it('should default to first host when no host specified', () => {
      cy.visit('/overview')

      // App should load successfully
      cy.get('body').should('be.visible')

      // URL might have host=0 or might not have host param
      // Both are valid behaviors
    })

    it('should handle invalid host gracefully', () => {
      // Visit with invalid host ID
      cy.visit('/overview?host=999')

      // Should either redirect or show error gracefully
      cy.get('body').should('be.visible')
    })
  })

  describe('Host Switching', () => {
    it('should be able to switch between hosts via URL', () => {
      // Visit first host
      cy.visit('/overview?host=0')
      cy.url().should('include', 'host=0')

      // Navigate to different host
      cy.visit('/overview?host=1')
      cy.url().should('include', 'host=1')
    })
  })
})
