/**
 * API mocking utilities for Cypress tests
 * Provides consistent API responses for test reliability
 */

export const setupApiMocks = () => {
  // Mock the main query endpoint
  cy.intercept('POST', '/api/query', (req) => {
    const { hostId = '0' } = req.body || {}
    
    // Return different data based on hostId to simulate multi-host behavior
    const baseData = {
      data: [
        {
          event_time: '2024-01-01 00:00:00',
          query_count: hostId === '0' ? 145 : 167,
          breakdown: [
            ['Select', hostId === '0' ? 89 : 102],
            ['Insert', hostId === '0' ? 45 : 52],
            ['Create', hostId === '0' ? 11 : 13]
          ]
        }
      ],
      metadata: {
        queryId: `test-query-${hostId}-${Date.now()}`,
        duration: 0.025,
        rows: 1,
        host: `host-${hostId}:8123`
      }
    }
    
    req.reply(baseData)
  }).as('queryRequest')

  // Mock health check endpoint
  cy.intercept('GET', '/healthz', { statusCode: 200, body: { status: 'ok' } }).as('healthCheck')
  
  // Mock version endpoint
  cy.intercept('GET', '/api/version', { 
    statusCode: 200, 
    body: { version: '1.0.0', build: 'test' } 
  }).as('versionCheck')

  // Mock uptime endpoint for host status
  cy.intercept('GET', '/api/uptime**', (req) => {
    const url = new URL(req.url)
    const hostId = url.searchParams.get('hostId') || '0'
    
    req.reply({
      uptime: `${Math.floor(Math.random() * 30) + 1} days`,
      hostName: `test-host-${hostId}`,
      version: '24.12.0.0'
    })
  }).as('uptimeCheck')
}

export const waitForInitialLoad = () => {
  cy.get('[data-testid="host-selector"]', { timeout: 10000 }).should('exist')
  cy.get('body').should('not.have.class', 'loading')
}

export const waitForChartData = (chartSelector: string, timeout = 10000) => {
  cy.get(chartSelector, { timeout })
    .should('exist')
    .should('be.visible')
    .invoke('text')
    .should('not.be.empty')
}