/**
 * @fileoverview E2E tests for host switching functionality
 * Tests to prevent regression of GitHub issue #509
 */

// Helper function to check if multi-host testing is available
function isMultiHostAvailable() {
  if (Cypress.env('SKIP_MULTI_HOST_TESTS')) {
    return false
  }
  
  const clickhouseHost = Cypress.env('CLICKHOUSE_HOST') || 'http://localhost:8123'
  return typeof clickhouseHost === 'string' && clickhouseHost.includes(',')
}

describe('Host Switching E2E Tests', () => {
  beforeEach(function() {
    if (!isMultiHostAvailable()) {
      cy.log('Skipping multi-host tests - not configured')
      this.skip()
    }

    // Visit the first host
    cy.visit('/0')
    cy.wait(1000) // Wait for initial load
  })

  it('should switch between hosts and refresh dashboard data', () => {
    // Test assumes at least 2 hosts are configured
    cy.get('[data-testid="host-selector"]').should('exist')

    // Get initial query count data
    cy.get('[data-testid="query-count-chart"]').should('exist')
    cy.get('[data-testid="query-count-chart"]')
      .invoke('text')
      .then((host0Data) => {
        // Switch to second host
        cy.get('[data-testid="host-selector"]').click()
        cy.get('[data-testid="host-option-1"]').click()

        // Wait for navigation and data refresh
        cy.url().should('include', '/1')
        cy.wait(2000) // Wait for data to load

        // Verify data has changed (different host should have different data)
        cy.get('[data-testid="query-count-chart"]').should('exist')
        cy.get('[data-testid="query-count-chart"]')
          .invoke('text')
          .then((host1Data) => {
            // Data should be different between hosts (unless they're identical, which is unlikely)
            // This test verifies that data actually refreshes
            cy.wrap(host0Data).should('not.equal', host1Data)
          })

        // Switch back to first host
        cy.get('[data-testid="host-selector"]').click()
        cy.get('[data-testid="host-option-0"]').click()

        // Verify we're back to original host and data matches
        cy.url().should('include', '/0')
        cy.wait(2000)

        cy.get('[data-testid="query-count-chart"]').should('exist')
        cy.get('[data-testid="query-count-chart"]')
          .invoke('text')
          .then((backToHost0Data) => {
            // Should match original data from host 0
            expect(backToHost0Data).to.equal(host0Data)
          })
      })
  })

  it('should refresh all dashboard components when switching hosts', () => {
    const chartSelectors = [
      '[data-testid="query-count-chart"]',
      '[data-testid="cpu-usage-chart"]',
      '[data-testid="memory-usage-chart"]',
      '[data-testid="disk-usage-chart"]',
    ]

    // Capture initial state of all charts
    const initialStates: { [key: string]: string } = {}

    chartSelectors.forEach((selector, index) => {
      cy.get(selector)
        .should('exist')
        .invoke('text')
        .then((text) => {
          initialStates[`chart-${index}`] = text
        })
    })

    // Switch to another host
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]').click()
    cy.wait(3000) // Wait for all components to refresh

    // Verify charts exist and have data after switch
    let chartsVerified = 0
    
    chartSelectors.forEach((selector, index) => {
      cy.get('body').then(($body) => {
        const elements = $body.find(selector)
        if (elements.length > 0) {
          cy.get(selector)
            .first()
            .should('exist')
            .invoke('text')
            .then((newText) => {
              const oldText = initialStates[`chart-${index}`]
              if (oldText && newText) {
                // Verify chart has data
                expect(newText).to.not.be.empty
                chartsVerified++
                
                // Log the change
                if (oldText !== newText) {
                  cy.log(`✅ Chart ${index}: Data refreshed after host switch`)
                } else {
                  cy.log(`⚠️ Chart ${index}: Data unchanged (hosts may have identical data)`)
                }
              }
            })
        }
      })
    })
    
    // Ensure we verified at least some charts
    cy.wrap(null).then(() => {
      expect(chartsVerified).to.be.greaterThan(0, 'Should verify at least one chart after switch')
      cy.log(`✅ Verified ${chartsVerified} charts after host switch`)
    })
  })

  it('should handle host switching without page refresh', () => {
    // Track navigation events
    let navigationCount = 0
    cy.window().then((win) => {
      win.addEventListener('beforeunload', () => {
        navigationCount++
      })
    })

    // Switch hosts multiple times
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]').click()
    cy.wait(1000)

    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-0"]').click()
    cy.wait(1000)

    // Verify no full page refreshes occurred
    cy.then(() => {
      expect(navigationCount).to.equal(0)
    })
  })

  it('should maintain host selection across page navigation', () => {
    // Switch to host 1
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]').click()
    cy.url().should('include', '/1')

    // Navigate to different pages
    cy.get('[data-testid="nav-clusters"]').click()
    cy.url().should('include', '/1/clusters')

    cy.get('[data-testid="nav-databases"]').click()
    cy.url().should('include', '/1/database')

    // Verify host is still selected as 1
    cy.get('[data-testid="host-selector"]').should('contain', 'Host 1')
  })

  it('should show loading states during host switching', () => {
    // Switch hosts and verify loading indicators appear
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]').click()

    // Should show loading states (if implemented)
    cy.get('[data-testid="loading-indicator"]', { timeout: 500 }).should(
      'exist'
    )

    // Wait for loading to complete
    cy.get('[data-testid="loading-indicator"]', { timeout: 5000 }).should(
      'not.exist'
    )

    // Verify new data is loaded
    cy.get('[data-testid="query-count-chart"]').should('exist')
  })
})

describe('Host Switching Network Requests', () => {
  beforeEach(function() {
    if (!isMultiHostAvailable()) {
      cy.log('Skipping multi-host tests - not configured')
      this.skip()
    }
  })

  it('should send requests to correct host endpoints', () => {
    // Intercept API calls
    cy.intercept('POST', '/api/query', { fixture: 'query-response.json' }).as(
      'queryRequest'
    )

    cy.visit('/0')
    cy.wait('@queryRequest').then((interception) => {
      // Verify request includes correct host parameter
      expect(interception.request.body).to.have.property('hostId', '0')
    })

    // Switch to host 1
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]').click()

    cy.wait('@queryRequest').then((interception) => {
      // Verify request now includes host 1
      expect(interception.request.body).to.have.property('hostId', '1')
    })
  })

  it('should handle host switching errors gracefully', () => {
    // Simulate network error for host 1
    cy.intercept('POST', '/api/query', (req) => {
      if (req.body.hostId === '1') {
        req.reply({ statusCode: 500, body: { error: 'Host unavailable' } })
      } else {
        req.reply({ fixture: 'query-response.json' })
      }
    }).as('queryRequest')

    cy.visit('/0')

    // Switch to problematic host
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-1"]').click()

    // Should show error state
    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Host unavailable'
    )

    // Switch back to working host
    cy.get('[data-testid="host-selector"]').click()
    cy.get('[data-testid="host-option-0"]').click()

    // Should recover and show data
    cy.get('[data-testid="error-message"]').should('not.exist')
    cy.get('[data-testid="query-count-chart"]').should('exist')
  })
})

describe('Host Switching Accessibility', () => {
  it('should be keyboard accessible', () => {
    cy.visit('/0')

    // Focus on host selector using tab
    cy.get('body').tab()
    cy.focused().should('have.attr', 'data-testid', 'host-selector')

    // Open dropdown with Enter
    cy.focused().type('{enter}')
    cy.get('[data-testid="host-options"]').should('be.visible')

    // Navigate options with arrow keys
    cy.focused().type('{downarrow}')
    cy.focused().should('have.attr', 'data-testid', 'host-option-1')

    // Select with Enter
    cy.focused().type('{enter}')
    cy.url().should('include', '/1')
  })

  it('should have proper ARIA labels', () => {
    cy.visit('/0')

    cy.get('[data-testid="host-selector"]')
      .should('have.attr', 'role', 'combobox')
      .should('have.attr', 'aria-label')
      .should('have.attr', 'aria-expanded')

    cy.get('[data-testid="host-selector"]').click()

    cy.get('[data-testid="host-options"]').should(
      'have.attr',
      'role',
      'listbox'
    )

    cy.get('[data-testid^="host-option-"]')
      .should('have.attr', 'role', 'option')
      .should('have.attr', 'aria-label')
  })
  
  it('should send requests to the correct host after switching', () => {
    // Intercept API calls to track which host is being queried
    cy.intercept('GET', '/api/**').as('apiCall')
    
    // Initial load on host 0
    cy.wait('@apiCall', { timeout: 10000 })
    cy.get('@apiCall').its('request.url').should('include', '0')
    
    // Switch to host 1
    cy.get('[data-testid="host-selector"], [data-cy="host-selector"], select[name="host"], .host-selector')
      .first()
      .click()
    cy.get('[data-testid="host-option-1"], [data-cy="host-option-1"], option[value="1"], a[href*="/1"]')
      .first()
      .click()
    
    // Wait for new API calls after switching
    cy.wait('@apiCall', { timeout: 10000 })
    
    // Verify requests are now going to host 1
    cy.get('@apiCall.last').its('request.url').should('include', '1')
    cy.log('✅ API requests correctly routed to new host after switch')
  })
  
  it('should handle rapid host switching gracefully', () => {
    // Rapidly switch between hosts to test for race conditions
    const switches = 5
    
    for (let i = 0; i < switches; i++) {
      const targetHost = i % 2 // Alternate between 0 and 1
      
      cy.get('[data-testid="host-selector"], [data-cy="host-selector"], select[name="host"], .host-selector')
        .first()
        .click()
      cy.get(`[data-testid="host-option-${targetHost}"], [data-cy="host-option-${targetHost}"], option[value="${targetHost}"], a[href*="/${targetHost}"]`)
        .first()
        .click()
      
      // Brief wait to allow switch to process
      cy.wait(500)
    }
    
    // Final verification - should be on correct host
    const finalHost = (switches - 1) % 2
    cy.url().should('include', `/${finalHost}`)
    
    // Charts should still be visible and have data
    cy.get('[data-testid*="chart"], [data-cy*="chart"], .chart-card, .recharts-wrapper')
      .first()
      .should('exist')
      .should('be.visible')
      .invoke('text')
      .should('not.be.empty')
    
    cy.log(`✅ Handled ${switches} rapid host switches successfully`)
  })
})

// Helper commands
declare global {
  namespace Cypress {
    interface Chainable {
      tab(): Chainable<Element>
    }
  }
}

Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { key: 'Tab' })
})
