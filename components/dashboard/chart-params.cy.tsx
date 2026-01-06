import { ChartParams } from './chart-params'

describe('<ChartParams />', () => {
  const defaultParams = {
    interval: '300',
    date_from: '2025-01-01',
    date_to: '2025-01-31',
  }

  beforeEach(() => {
    // Mock the router
    cy.stub(window.history, 'pushState').as('pushState')

    // Mock the Next.js router.refresh
    cy.window().then((win) => {
      win.router = {
        refresh: cy.stub().as('routerRefresh'),
      }
    })
  })

  describe('Form Rendering', () => {
    it('renders form with all params', () => {
      cy.mount(<ChartParams params={defaultParams} />)

      // Should have label and input for each param
      cy.contains('interval').should('be.visible')
      cy.get('input[name="interval"]').should('have.value', '300')

      cy.contains('date_from').should('be.visible')
      cy.get('input[name="date_from"]').should('have.value', '2025-01-01')

      cy.contains('date_to').should('be.visible')
      cy.get('input[name="date_to"]').should('have.value', '2025-01-31')

      // Should have submit button
      cy.contains('button', 'Update').should('be.visible')
    })

    it('renders form with single param', () => {
      const singleParam = { interval: '600' }

      cy.mount(<ChartParams params={singleParam} />)

      cy.contains('interval').should('be.visible')
      cy.get('input[name="interval"]').should('have.value', '600')

      // Should have only one input field
      cy.get('input').should('have.length', 1)
    })

    it('renders form with empty params', () => {
      cy.mount(<ChartParams params={{}} />)

      // Should still have submit button
      cy.contains('button', 'Update').should('be.visible')

      // Should have no input fields
      cy.get('input').should('have.length', 0)
    })
  })

  describe('Form Validation (Zod Schema)', () => {
    it('accepts valid string values', () => {
      cy.mount(<ChartParams params={defaultParams} />)

      // All values should be valid (Zod allows any string)
      cy.get('input[name="interval"]').should('have.value', '300')
      cy.get('input[name="date_from"]').should('have.value', '2025-01-01')
      cy.get('input[name="date_to"]').should('have.value', '2025-01-31')
    })

    it('allows updating form values', () => {
      cy.mount(<ChartParams params={defaultParams} />)

      cy.get('input[name="interval"]').clear().type('600')
      cy.get('input[name="interval"]').should('have.value', '600')

      cy.get('input[name="date_from"]').clear().type('2025-02-01')
      cy.get('input[name="date_from"]').should('have.value', '2025-02-01')
    })

    it('allows empty string values (valid per Zod schema)', () => {
      cy.mount(<ChartParams params={defaultParams} />)

      // Clear the input - empty strings are valid per z.string()
      cy.get('input[name="interval"]').clear()
      cy.get('input[name="interval"]').should('have.value', '')

      cy.get('input[name="date_from"]').clear()
      cy.get('input[name="date_from"]').should('have.value', '')
    })

    it('allows special characters in values', () => {
      const paramsWithSpecialChars = {
        query: 'SELECT * FROM table WHERE name = "test\'s value"',
        filter: 'value-with_special.chars',
      }

      cy.mount(<ChartParams params={paramsWithSpecialChars} />)

      cy.get('input[name="query"]').should(
        'have.value',
        'SELECT * FROM table WHERE name = "test\'s value"'
      )
      cy.get('input[name="filter"]').should(
        'have.value',
        'value-with_special.chars'
      )
    })
  })

  describe('Submit Success State', () => {
    it('submits form and calls router.refresh on success', () => {
      // Mock successful API response
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 200,
        body: { success: true },
      }).as('updateSettings')

      cy.mount(<ChartParams params={defaultParams} />)

      // Update a value
      cy.get('input[name="interval"]').clear().type('600')

      // Submit form
      cy.contains('button', 'Update').click()

      // Should show loading state
      cy.contains('Updating...').should('be.visible')

      // Wait for API call
      cy.wait('@updateSettings')

      // Should call router.refresh
      cy.get('@routerRefresh').should('have.been.calledOnce')

      // Button should return to normal state
      cy.contains('button', 'Update').should('be.visible')
    })

    it('submits form with all current values', () => {
      const requestBodySpy = cy.stub().as('requestBodySpy')

      cy.intercept('POST', '/api/v1/dashboard/settings', (req) => {
        requestBodySpy(req.body)
        return {
          statusCode: 200,
          body: { success: true },
        }
      }).as('updateSettings')

      cy.mount(<ChartParams params={defaultParams} />)

      // Submit form
      cy.contains('button', 'Update').click()

      cy.wait('@updateSettings')

      // Verify the request body contains all params
      cy.get('@requestBodySpy').should('have.been.calledOnce')
      cy.get('@requestBodySpy').then((spy) => {
        const body = spy.getCall(0).args[0]
        expect(body).to.have.property('params')
        expect(body.params).to.deep.equal(defaultParams)
      })
    })

    it('shows spinner icon during submission', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        delay: 1000,
        statusCode: 200,
        body: { success: true },
      }).as('updateSettings')

      cy.mount(<ChartParams params={defaultParams} />)

      cy.contains('button', 'Update').click()

      // Should show spinner icon with animate-spin class
      cy.get('.animate-spin').should('be.visible')
      cy.contains('Updating...').should('be.visible')
    })
  })

  describe('Submit Error State', () => {
    it('shows error message on API failure', () => {
      // Mock failed API response
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 500,
        body: { error: 'Failed to update settings' },
      }).as('updateSettingsError')

      cy.mount(<ChartParams params={defaultParams} />)

      // Submit form
      cy.contains('button', 'Update').click()

      cy.wait('@updateSettingsError')

      // Should show error state
      cy.contains('Update').should('be.visible')
      cy.contains('(error)').should('be.visible')
    })

    it('changes button variant to destructive on error', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 500,
        body: { error: 'Failed to update settings' },
      }).as('updateSettingsError')

      cy.mount(<ChartParams params={defaultParams} />)

      cy.contains('button', 'Update').click()

      cy.wait('@updateSettingsError')

      // Button should have destructive variant after error
      cy.contains('button', 'Update (error)').should('be.visible')
    })

    it('allows retry after error', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 500,
        body: { error: 'Network error' },
      }).as('updateSettingsError')

      cy.mount(<ChartParams params={defaultParams} />)

      // First submit fails
      cy.contains('button', 'Update').click()
      cy.wait('@updateSettingsError')
      cy.contains('(error)').should('be.visible')

      // Change to success for retry
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 200,
        body: { success: true },
      }).as('updateSettingsSuccess')

      // Retry submit
      cy.contains('button', 'Update (error)').click()

      // Should show loading state again
      cy.contains('Updating...').should('be.visible')

      cy.wait('@updateSettingsSuccess')

      // Error message should be gone
      cy.contains('(error)').should('not.exist')
      cy.contains('button', 'Update').should('be.visible')
    })

    it('handles network errors gracefully', () => {
      // Mock network failure
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        forceNetworkError: true,
      }).as('updateSettingsNetworkError')

      cy.mount(<ChartParams params={defaultParams} />)

      cy.contains('button', 'Update').click()

      // Should still show error state
      cy.contains('(error)').should('be.visible')
    })
  })

  describe('Router Refresh', () => {
    it('calls router.refresh after successful update', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 200,
        body: { success: true },
      }).as('updateSettings')

      cy.mount(<ChartParams params={defaultParams} />)

      cy.contains('button', 'Update').click()

      cy.wait('@updateSettings')

      // Verify router.refresh was called
      cy.get('@routerRefresh').should('have.been.calledOnce')
    })

    it('does not call router.refresh on failed update', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 500,
        body: { error: 'Failed' },
      }).as('updateSettingsError')

      cy.mount(<ChartParams params={defaultParams} />)

      cy.contains('button', 'Update').click()

      cy.wait('@updateSettingsError')

      // router.refresh should not be called on error
      cy.get('@routerRefresh').should('not.have.been.called')
    })
  })

  describe('Interval and Date Inputs', () => {
    it('handles numeric interval values', () => {
      const numericParams = {
        interval: '300',
        limit: '100',
        offset: '0',
      }

      cy.mount(<ChartParams params={numericParams} />)

      cy.get('input[name="interval"]').should('have.value', '300')
      cy.get('input[name="limit"]').should('have.value', '100')
      cy.get('input[name="offset"]').should('have.value', '0')
    })

    it('handles date inputs in ISO format', () => {
      const dateParams = {
        date_from: '2025-01-01',
        date_to: '2025-12-31',
        created_at: '2025-06-15T10:30:00Z',
      }

      cy.mount(<ChartParams params={dateParams} />)

      cy.get('input[name="date_from"]').should('have.value', '2025-01-01')
      cy.get('input[name="date_to"]').should('have.value', '2025-12-31')
      cy.get('input[name="created_at"]').should(
        'have.value',
        '2025-06-15T10:30:00Z'
      )
    })

    it('handles interval values like 300, 600, 900', () => {
      const intervalParams = { interval: '300' }

      cy.mount(<ChartParams params={intervalParams} />)

      cy.get('input[name="interval"]').clear().type('600')
      cy.get('input[name="interval"]').should('have.value', '600')

      // Submit with new value
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 200,
        body: { success: true },
      }).as('updateSettings')

      cy.contains('button', 'Update').click()

      cy.wait('@updateSettings')
      cy.get('@routerRefresh').should('have.been.calledOnce')
    })
  })

  describe('Form Layout', () => {
    it('renders form in flex container', () => {
      cy.mount(<ChartParams params={defaultParams} />)

      // Form should be in a flex container
      cy.get('form').should('have.class', 'flex')
    })

    it('displays form fields horizontally on larger screens', () => {
      cy.mount(<ChartParams params={defaultParams} />)

      // Form should have flex-row class for horizontal layout
      cy.get('form').should('have.class', 'sm:flex-row')
    })

    it('displays form fields vertically on small screens', () => {
      cy.mount(<ChartParams params={defaultParams} />)

      // Form should have flex-col class for mobile vertical layout
      cy.get('form').should('have.class', 'flex-col')
    })
  })

  describe('Button States', () => {
    it('disables button during submission', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        delay: 1000,
        statusCode: 200,
        body: { success: true },
      }).as('updateSettings')

      cy.mount(<ChartParams params={defaultParams} />)

      cy.contains('button', 'Update').click()

      // Button should be disabled during submission
      cy.contains('button', 'Updating...').should('be.disabled')
    })

    it('shows Update icon in button during loading', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        delay: 1000,
        statusCode: 200,
        body: { success: true },
      }).as('updateSettings')

      cy.mount(<ChartParams params={defaultParams} />)

      cy.contains('button', 'Update').click()

      // Should show UpdateIcon from Radix
      cy.get('button').find('svg').should('be.visible')
    })
  })
})
