/**
 * @fileoverview E2E tests for host switching functionality with query parameter routing
 * Tests the new static site architecture with ?host= query parameters
 *
 * Architecture: Static pages with query parameter routing
 * Old: /0/overview → New: /overview?host=0
 */

describe('Host Switching E2E Tests (Query Parameter Routing)', () => {
  let isMultiHost = false

  before(() => {
    // Check if multi-host environment by visiting overview and checking for selector
    cy.visit('/overview?host=0', { timeout: 30000 })
    cy.get('body').then(($body) => {
      isMultiHost = $body.find('[data-testid="host-selector"]').length > 0
      cy.log(`Multi-host environment: ${isMultiHost}`)
    })
  })

  beforeEach(() => {
    cy.visit('/overview?host=0', { timeout: 30000 })
    // Wait for page to load
    cy.get('body', { timeout: 20000 }).should('exist')
  })

  it('should load overview page with host query parameter', () => {
    // Verify URL has host query parameter
    cy.url().should('include', 'host=0')
    cy.url().should('include', '/overview')

    // Verify page content loads
    cy.get('body').should('contain', 'Overview')
  })

  it('should switch between hosts via query parameter', function () {
    if (!isMultiHost) {
      cy.log('Skipping: Single host environment detected')
      this.skip()
    }

    // Verify we're on host 0
    cy.url().should('include', 'host=0')

    // Host selector should be present and functional
    cy.get('[data-testid="host-selector"]').should('exist').and('be.visible')

    // Switch to host 1 by clicking selector
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]', { timeout: 10000 })
      .should('be.visible')
      .click()

    // Verify URL changed to host 1 (query parameter routing)
    cy.url().should('include', 'host=1')
    cy.url().should('include', '/overview')

    // Verify page elements still exist (basic rendering check)
    cy.get('[data-testid="host-selector"]').should('exist')

    // Switch back to host 0
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-0"]').should('be.visible').click()

    // Verify we're back on host 0
    cy.url().should('include', 'host=0')
    cy.get('[data-testid="host-selector"]').should('exist')
  })

  it('should maintain host selection across navigation', function () {
    if (!isMultiHost) {
      cy.log('Skipping: Single host environment detected')
      this.skip()
    }

    // Switch to host 1
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]').should('be.visible').click()
    cy.url().should('include', 'host=1')

    // Navigate to different pages - host should persist in query params
    cy.visit('/dashboard?host=1')
    cy.url().should('include', 'host=1')
    cy.url().should('include', '/dashboard')

    cy.visit('/table?host=1')
    cy.url().should('include', 'host=1')
    cy.url().should('include', '/table')

    cy.visit('/running-queries?host=1')
    cy.url().should('include', 'host=1')
    cy.url().should('include', '/running-queries')
  })

  it('should display page correctly in single-host environment', function () {
    if (isMultiHost) {
      cy.log('Skipping: Multi-host environment detected')
      this.skip()
    }

    // In single-host mode, just verify the page loads and displays content
    cy.url().should('include', 'host=0')
    cy.url().should('include', '/overview')

    // Verify basic page elements exist
    cy.get('body').should('contain', 'Overview')

    // Can navigate to other pages with host in query params
    cy.visit('/clusters?host=0', { timeout: 30000 })
    cy.url().should('include', 'host=0')
    cy.url().should('include', '/clusters')
  })
})

describe('Critical User Flows', () => {
  beforeEach(() => {
    cy.visit('/overview?host=0', { timeout: 30000 })
  })

  it('should navigate to all main pages', () => {
    // Test navigation to key pages
    const pages = [
      '/overview',
      '/dashboard',
      '/table',
      '/tables',
      '/clusters',
      '/running-queries',
      '/merges',
      '/mutations',
      '/settings',
    ]

    pages.forEach((page) => {
      cy.visit(`${page}?host=0`, { timeout: 30000 })
      cy.url().should('include', page)
      cy.url().should('include', 'host=0')
      // Verify page loaded (no JavaScript errors)
      cy.get('body').should('exist')
    })
  })

  it('should load charts on overview page', () => {
    cy.visit('/overview?host=0', { timeout: 30000 })

    // Verify chart containers exist
    cy.get('[data-testid*="-chart"]').should('have.length.greaterThan', 0)

    // Check for loading states or chart elements
    cy.get('body').should('contain', 'Overview')
  })

  it('should handle missing hostId gracefully', () => {
    // Visit without host parameter
    cy.visit('/overview', { timeout: 30000 })

    // Should still load (default to host 0 or show selector)
    cy.get('body').should('exist')
  })

  it('should handle invalid hostId gracefully', () => {
    // Visit with invalid host parameter
    cy.visit('/overview?host=999', { timeout: 30000 })

    // Should handle error gracefully
    cy.get('body').should('exist')
  })
})

describe('API Endpoints', () => {
  it('should fetch hosts list successfully', () => {
    cy.request('/api/v1/hosts').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('data')
      expect(response.body.data).to.be.an('array')
    })
  })

  it('should fetch chart data successfully', () => {
    cy.request('/api/v1/charts/query-count?hostId=0').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('data')
    })
  })

  it('should handle missing chart gracefully', () => {
    cy.request({
      url: '/api/v1/charts/non-existent-chart?hostId=0',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404)
      expect(response.body).to.have.property('success', false)
    })
  })
})
