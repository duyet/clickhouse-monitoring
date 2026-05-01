import { ChartParamsForm } from './chart-params'

describe('<ChartParams />', () => {
  const defaultParams = {
    interval: '300',
    date_from: '2025-01-01',
    date_to: '2025-01-31',
  }

  const mountChartParams = (params: Record<string, string>) => {
    const onRefresh = cy.stub().as('routerRefresh')
    cy.mount(<ChartParamsForm params={params} onRefresh={onRefresh} />)
  }

  describe('Form Rendering', () => {
    it('renders form with all params', () => {
      mountChartParams(defaultParams)

      cy.contains('interval').should('be.visible')
      cy.get('input[name="interval"]').should('have.value', '300')

      cy.contains('date_from').should('be.visible')
      cy.get('input[name="date_from"]').should('have.value', '2025-01-01')

      cy.contains('date_to').should('be.visible')
      cy.get('input[name="date_to"]').should('have.value', '2025-01-31')

      cy.contains('button', 'Update').should('be.visible')
    })

    it('renders form with single param', () => {
      const singleParam = { interval: '600' }

      mountChartParams(singleParam)

      cy.contains('interval').should('be.visible')
      cy.get('input[name="interval"]').should('have.value', '600')
      cy.get('input').should('have.length', 1)
    })

    it('renders form with empty params', () => {
      mountChartParams({})

      cy.contains('button', 'Update').should('be.visible')
      cy.get('input').should('have.length', 0)
    })
  })

  describe('Form Validation (Zod Schema)', () => {
    it('accepts valid string values', () => {
      mountChartParams(defaultParams)

      cy.get('input[name="interval"]').should('have.value', '300')
      cy.get('input[name="date_from"]').should('have.value', '2025-01-01')
      cy.get('input[name="date_to"]').should('have.value', '2025-01-31')
    })

    it('allows updating form values', () => {
      mountChartParams(defaultParams)

      cy.get('input[name="interval"]').clear().type('600')
      cy.get('input[name="interval"]').should('have.value', '600')

      cy.get('input[name="date_from"]').clear().type('2025-02-01')
      cy.get('input[name="date_from"]').should('have.value', '2025-02-01')
    })

    it('allows empty string values (valid per Zod schema)', () => {
      mountChartParams(defaultParams)

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

      mountChartParams(paramsWithSpecialChars)

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
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 200,
        delay: 100,
        body: { success: true },
      }).as('updateSettings')

      mountChartParams(defaultParams)

      cy.get('input[name="interval"]').clear().type('600')
      cy.contains('button', 'Update').click()

      cy.contains('Updating...').should('be.visible')
      cy.wait('@updateSettings')
      cy.get('@routerRefresh').should('have.been.calledOnce')
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

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()
      cy.wait('@updateSettings')

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

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()

      cy.get('.animate-spin').should('be.visible')
      cy.contains('Updating...').should('be.visible')
    })
  })

  describe('Submit Error State', () => {
    it('shows error message on API failure', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 500,
        body: { error: 'Failed to update settings' },
      }).as('updateSettingsError')

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()
      cy.wait('@updateSettingsError')

      cy.contains('Update').should('be.visible')
      cy.contains('(error)').should('be.visible')
    })

    it('changes button variant to destructive on error', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 500,
        body: { error: 'Failed to update settings' },
      }).as('updateSettingsError')

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()
      cy.wait('@updateSettingsError')

      cy.contains('button', 'Update (error)').should('be.visible')
    })

    it('allows retry after error', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 500,
        body: { error: 'Network error' },
      }).as('updateSettingsError')

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()
      cy.wait('@updateSettingsError')
      cy.contains('(error)').should('be.visible')

      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 200,
        delay: 100,
        body: { success: true },
      }).as('updateSettingsSuccess')

      cy.contains('button', 'Update (error)').click()
      cy.contains('Updating...').should('be.visible')
      cy.wait('@updateSettingsSuccess')

      cy.contains('(error)').should('not.exist')
      cy.contains('button', 'Update').should('be.visible')
    })

    it('handles network errors gracefully', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        forceNetworkError: true,
      }).as('updateSettingsNetworkError')

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()
      cy.contains('(error)').should('be.visible')
    })
  })

  describe('Router Refresh', () => {
    it('calls router.refresh after successful update', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 200,
        body: { success: true },
      }).as('updateSettings')

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()
      cy.wait('@updateSettings')

      cy.get('@routerRefresh').should('have.been.calledOnce')
    })

    it('does not call router.refresh on failed update', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        statusCode: 500,
        body: { error: 'Failed' },
      }).as('updateSettingsError')

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()
      cy.wait('@updateSettingsError')

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

      mountChartParams(numericParams)

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

      mountChartParams(dateParams)

      cy.get('input[name="date_from"]').should('have.value', '2025-01-01')
      cy.get('input[name="date_to"]').should('have.value', '2025-12-31')
      cy.get('input[name="created_at"]').should(
        'have.value',
        '2025-06-15T10:30:00Z'
      )
    })

    it('handles interval values like 300, 600, 900', () => {
      const intervalParams = { interval: '300' }

      mountChartParams(intervalParams)

      cy.get('input[name="interval"]').clear().type('600')
      cy.get('input[name="interval"]').should('have.value', '600')

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
      mountChartParams(defaultParams)

      cy.get('form').should('have.class', 'flex')
    })

    it('displays form fields horizontally on larger screens', () => {
      mountChartParams(defaultParams)

      cy.get('form').should('have.class', 'sm:flex-row')
    })

    it('displays form fields vertically on small screens', () => {
      mountChartParams(defaultParams)

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

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()

      cy.contains('button', 'Updating...').should('be.disabled')
    })

    it('shows Update icon in button during loading', () => {
      cy.intercept('POST', '/api/v1/dashboard/settings', {
        delay: 1000,
        statusCode: 200,
        body: { success: true },
      }).as('updateSettings')

      mountChartParams(defaultParams)

      cy.contains('button', 'Update').click()

      cy.get('button').find('svg').should('be.visible')
    })
  })
})
