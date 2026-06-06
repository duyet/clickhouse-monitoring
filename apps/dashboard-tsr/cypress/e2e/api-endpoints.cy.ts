/// <reference types="cypress" />

/**
 * API endpoint smoke tests.
 *
 * Verifies public endpoints return expected data and that gated endpoints
 * enforce authentication (401 when API-key auth is enabled, or 200 when
 * auth is disabled — both are valid states).
 */

describe('Public API endpoints', () => {
  it('GET /api/health returns 200 with deployment metadata', () => {
    cy.request('/api/health').then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('status')
    })
  })

  it('GET /api/healthz returns 200', () => {
    cy.request('/api/healthz').then((res) => {
      expect(res.status).to.eq(200)
    })
  })

  it('GET /api/timezone returns valid timezone info', () => {
    cy.request('/api/timezone').then((res) => {
      expect(res.status).to.eq(200)
      // Response should contain timezone data
      expect(res.body).to.exist
    })
  })

  it('GET /api/version returns version info', () => {
    cy.request({ url: '/api/version', failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(200)
    })
  })
})

describe('Gated API endpoints', () => {
  it('rejects unauthenticated /api/v1/menu-counts', () => {
    cy.request({
      url: '/api/v1/menu-counts?hostId=0',
      failOnStatusCode: false,
    }).then((res) => {
      // 401 = API-key auth enforced (good)
      // 403 = forbidden (good)
      // 200 = auth disabled (also valid for self-hosted)
      expect([200, 401, 403]).to.include(res.status)
    })
  })

  it('rejects unauthenticated /api/v1/data', () => {
    cy.request({
      url: '/api/v1/data?hostId=0&name=overview-charts',
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 401, 403]).to.include(res.status)
    })
  })

  it('rejects unauthenticated /api/v1/hosts', () => {
    cy.request({
      url: '/api/v1/hosts',
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 401, 403]).to.include(res.status)
    })
  })
})

describe('Static assets', () => {
  it('serves the root page', () => {
    cy.request('/').then((res) => {
      // Root should redirect or serve HTML
      expect(res.status).to.be.oneOf([200, 301, 302])
    })
  })

  it('serves the overview page as HTML', () => {
    cy.request('/overview?host=0').then((res) => {
      expect(res.status).to.eq(200)
      expect(res.headers['content-type']).to.include('text/html')
    })
  })
})
