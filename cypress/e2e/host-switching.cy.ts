/**
 * @fileoverview Host switching E2E tests - Simplified smoke tests
 * Tests the new static site architecture with ?host= query parameters
 */

describe('Host Switching Smoke Tests', () => {
  it('should load overview page with host query parameter', () => {
    cy.visit('/overview?host=0', { timeout: 30000 })
    cy.url().should('include', 'host=0')
    cy.url().should('include', '/overview')
    cy.get('body').should('contain', 'Overview')
  })

  it('should navigate to main pages with host parameter', () => {
    const pages = ['/overview', '/dashboard', '/clusters', '/running-queries']

    pages.forEach((page) => {
      cy.visit(`${page}?host=0`, { timeout: 30000 })
      cy.url().should('include', page)
      cy.url().should('include', 'host=0')
      cy.get('body').should('exist')
    })
  })

  it('should handle missing hostId gracefully', () => {
    cy.visit('/overview', { timeout: 30000 })
    cy.get('body').should('exist')
  })

  it('should handle invalid hostId gracefully', () => {
    cy.visit('/overview?host=999', { timeout: 30000 })
    cy.get('body').should('exist')
  })
})

describe('API Smoke Tests', () => {
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
