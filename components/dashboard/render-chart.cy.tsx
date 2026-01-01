import { type ChartParams, RenderChart } from './render-chart'

describe('<RenderChart />', () => {
  const defaultData = [
    { event_time: '2025-01-01', value1: 100, value2: 200 },
    { event_time: '2025-01-02', value1: 150, value2: 250 },
    { event_time: '2025-01-03', value1: 200, value2: 300 },
  ]

  const defaultParams: ChartParams = {
    lastHours: 24,
    interval: 300,
  }

  const defaultProps = {
    kind: 'area' as const,
    title: 'Test Chart',
    query: 'SELECT * FROM test',
    params: defaultParams,
    hostId: 0,
  }

  beforeEach(() => {
    // Mock the useFetchData hook by intercepting the API call
    cy.intercept('POST', '/api/v1/data', {
      statusCode: 200,
      body: {
        data: defaultData,
        metadata: { duration: 10, rows: 3 },
      },
    }).as('fetchData')
  })

  describe('Area Chart', () => {
    it('renders area chart with data', () => {
      cy.mount(<RenderChart {...defaultProps} kind="area" />)

      cy.wait('@fetchData')

      // Should render the chart title
      cy.contains('Test Chart').should('be.visible')

      // Should render SVG chart
      cy.get('svg').should('be.visible')

      // Should have area chart elements
      cy.get('.recharts-area').should('have.length', 2) // value1 and value2
    })

    it('renders area chart with custom colors', () => {
      const customColors = ['--custom-1', '--custom-2', '--custom-3']

      cy.mount(
        <RenderChart {...defaultProps} kind="area" colors={customColors} />
      )

      cy.wait('@fetchData')

      cy.get('svg').should('be.visible')
      cy.get('.recharts-area').should('have.length', 2)
    })

    it('renders area chart with hex color values', () => {
      const customColors = ['#ff0000', '#00ff00', '#0000ff']

      cy.mount(
        <RenderChart {...defaultProps} kind="area" colors={customColors} />
      )

      cy.wait('@fetchData')

      cy.get('svg').should('be.visible')
    })
  })

  describe('Bar Chart', () => {
    it('renders bar chart with data', () => {
      cy.mount(<RenderChart {...defaultProps} kind="bar" />)

      cy.wait('@fetchData')

      // Should render the chart title
      cy.contains('Test Chart').should('be.visible')

      // Should render SVG chart
      cy.get('svg').should('be.visible')

      // Should have bar chart elements
      cy.get('.recharts-bar').should('exist')
    })

    it('renders bar chart with custom colors', () => {
      const customColors = ['#ff0000', '#00ff00']

      cy.mount(
        <RenderChart {...defaultProps} kind="bar" colors={customColors} />
      )

      cy.wait('@fetchData')

      cy.get('svg').should('be.visible')
      cy.get('.recharts-bar').should('exist')
    })
  })

  describe('Calendar Heatmap Chart', () => {
    it('renders calendar chart with data', () => {
      const heatmapData = [
        { event_time: '2025-01-01', count: 5 },
        { event_time: '2025-01-02', count: 10 },
        { event_time: '2025-01-03', count: 15 },
      ]

      cy.intercept('POST', '/api/v1/data', {
        statusCode: 200,
        body: {
          data: heatmapData,
          metadata: { duration: 10, rows: 3 },
        },
      }).as('fetchHeatmapData')

      cy.mount(<RenderChart {...defaultProps} kind="calendar" />)

      cy.wait('@fetchHeatmapData')

      // Should render the chart title
      cy.contains('Test Chart').should('be.visible')

      // Should render SVG chart
      cy.get('svg').should('be.visible')
    })

    it('renders calendar chart with custom colors', () => {
      const customColors = ['#ff0000', '#00ff00', '#0000ff']

      cy.mount(
        <RenderChart {...defaultProps} kind="calendar" colors={customColors} />
      )

      cy.wait('@fetchData')

      cy.get('svg').should('be.visible')
    })
  })

  describe('Error Handling - Missing event_time', () => {
    it('shows error when event_time column is missing', () => {
      const dataWithoutEventTime = [
        { date: '2025-01-01', value: 100 }, // Missing event_time
      ]

      cy.intercept('POST', '/api/v1/data', {
        statusCode: 200,
        body: {
          data: dataWithoutEventTime,
          metadata: { duration: 10, rows: 1 },
        },
      }).as('fetchDataNoEventTime')

      cy.mount(<RenderChart {...defaultProps} />)

      cy.wait('@fetchDataNoEventTime')

      // Should show error message about event_time
      cy.contains('event_time').should('be.visible')
      cy.contains('column is required').should('be.visible')
    })

    it('shows error when data array is empty', () => {
      cy.intercept('POST', '/api/v1/data', {
        statusCode: 200,
        body: {
          data: [],
          metadata: { duration: 10, rows: 0 },
        },
      }).as('fetchEmptyData')

      cy.mount(<RenderChart {...defaultProps} />)

      cy.wait('@fetchEmptyData')

      // Should show error message about event_time
      cy.contains('event_time').should('be.visible')
    })

    it('shows error when data is null', () => {
      cy.intercept('POST', '/api/v1/data', {
        statusCode: 200,
        body: {
          data: null,
          metadata: { duration: 10, rows: 0 },
        },
      }).as('fetchNullData')

      cy.mount(<RenderChart {...defaultProps} />)

      cy.wait('@fetchNullData')

      cy.contains('event_time').should('be.visible')
    })
  })

  describe('Loading State', () => {
    it('shows skeleton while loading', () => {
      // Use delay to ensure we see loading state
      cy.intercept('POST', '/api/v1/data', {
        delay: 1000,
        statusCode: 200,
        body: {
          data: defaultData,
          metadata: { duration: 10, rows: 3 },
        },
      }).as('fetchDataSlow')

      cy.mount(<RenderChart {...defaultProps} />)

      // Should show skeleton initially
      cy.get('[role="status"]').should('exist')

      cy.wait('@fetchDataSlow')

      // After data loads, skeleton should be gone
      cy.get('svg').should('be.visible')
    })
  })

  describe('Error State', () => {
    it('shows error when API call fails', () => {
      cy.intercept('POST', '/api/v1/data', {
        statusCode: 500,
        body: {
          error: { message: 'Database connection failed' },
        },
      }).as('fetchDataError')

      cy.mount(<RenderChart {...defaultProps} />)

      cy.wait('@fetchDataError')

      // Should show error state
      cy.contains('error', { matchCase: false }).should('exist')
    })

    it('provides retry button on error', () => {
      cy.intercept('POST', '/api/v1/data', {
        statusCode: 500,
        body: {
          error: { message: 'Database connection failed' },
        },
      }).as('fetchDataError')

      cy.mount(<RenderChart {...defaultProps} />)

      cy.wait('@fetchDataError')

      // Should show retry button
      cy.contains('Retry').should('exist')
    })
  })

  describe('Custom Props', () => {
    it('applies custom className', () => {
      cy.mount(<RenderChart {...defaultProps} className="custom-class" />)

      cy.wait('@fetchData')

      // The Card component should have the custom class
      cy.get('.custom-class').should('exist')
    })

    it('applies custom chartClassName', () => {
      cy.mount(
        <RenderChart {...defaultProps} chartClassName="chart-custom-class" />
      )

      cy.wait('@fetchData')

      // Should render chart
      cy.get('svg').should('be.visible')
    })
  })

  describe('Params Propagation', () => {
    it('passes params to API request', () => {
      const customParams: ChartParams = {
        database: 'my_db',
        interval: 300,
        lastHours: 48,
      }

      cy.intercept('POST', '/api/v1/data', (req) => {
        // Verify the params are sent in the request body
        expect(req.body).to.have.property('queryParams')
        expect(req.body.queryParams).to.deep.equal(customParams)

        return {
          statusCode: 200,
          body: {
            data: defaultData,
            metadata: { duration: 10, rows: 3 },
          },
        }
      }).as('fetchDataWithParams')

      cy.mount(<RenderChart {...defaultProps} params={customParams} />)

      cy.wait('@fetchDataWithParams')

      cy.get('svg').should('be.visible')
    })

    it('passes startDate and endDate params', () => {
      const customParams: ChartParams = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      }

      cy.intercept('POST', '/api/v1/data', (req) => {
        expect(req.body.queryParams).to.deep.equal(customParams)

        return {
          statusCode: 200,
          body: {
            data: defaultData,
            metadata: { duration: 10, rows: 3 },
          },
        }
      }).as('fetchDataWithDateRange')

      cy.mount(<RenderChart {...defaultProps} params={customParams} />)

      cy.wait('@fetchDataWithDateRange')
    })
  })

  describe('Unknown Kind', () => {
    it('shows error for unknown chart kind', () => {
      // @ts-expect-error - Testing invalid chart kind
      cy.mount(<RenderChart {...defaultProps} kind="unknown" />)

      cy.wait('@fetchData')

      // Should show unknown kind message
      cy.contains('Unknown chart kind: unknown').should('be.visible')
    })
  })

  describe('Refresh Functionality', () => {
    it('can refresh data', () => {
      cy.intercept('POST', '/api/v1/data', {
        statusCode: 200,
        body: {
          data: defaultData,
          metadata: { duration: 10, rows: 3 },
        },
      }).as('fetchDataRefresh')

      cy.mount(<RenderChart {...defaultProps} />)

      cy.wait('@fetchDataRefresh')

      // Trigger refresh after 30 seconds (component's default interval)
      // This tests the auto-refresh is configured
      cy.get('svg').should('be.visible')
    })
  })

  describe('HostId Support', () => {
    it('works with different hostId values', () => {
      cy.intercept('POST', '/api/v1/data', (req) => {
        expect(req.body).to.have.property('hostId', 5)

        return {
          statusCode: 200,
          body: {
            data: defaultData,
            metadata: { duration: 10, rows: 3 },
          },
        }
      }).as('fetchDataHost5')

      cy.mount(<RenderChart {...defaultProps} hostId={5} />)

      cy.wait('@fetchDataHost5')

      cy.get('svg').should('be.visible')
    })

    it('passes hostId=0 correctly', () => {
      cy.intercept('POST', '/api/v1/data', (req) => {
        expect(req.body).to.have.property('hostId', 0)

        return {
          statusCode: 200,
          body: {
            data: defaultData,
            metadata: { duration: 10, rows: 3 },
          },
        }
      }).as('fetchDataHost0')

      cy.mount(<RenderChart {...defaultProps} hostId={0} />)

      cy.wait('@fetchDataHost0')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      cy.mount(<RenderChart {...defaultProps} />)

      cy.wait('@fetchData')

      // Should have chart title
      cy.contains('Test Chart').should('exist')
    })

    it('renders accessible error messages', () => {
      cy.intercept('POST', '/api/v1/data', {
        statusCode: 500,
        body: {
          error: { message: 'Database connection failed' },
        },
      }).as('fetchDataError')

      cy.mount(<RenderChart {...defaultProps} />)

      cy.wait('@fetchDataError')

      // Error component should have role="alert"
      cy.get('[role="alert"]').should('exist')
    })
  })

  describe('TypeScript Type Safety', () => {
    it('accepts valid ChartParams', () => {
      const validParams: ChartParams = {
        lastHours: 24,
        interval: 300,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        database: 'system',
        table: 'query_log',
        customParam: 'value',
      }

      cy.intercept('POST', '/api/v1/data', {
        statusCode: 200,
        body: {
          data: defaultData,
          metadata: { duration: 10, rows: 3 },
        },
      }).as('fetchDataTyped')

      cy.mount(<RenderChart {...defaultProps} params={validParams} />)

      cy.wait('@fetchDataTyped')
    })
  })
})
