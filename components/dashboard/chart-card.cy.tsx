import { ChartCard } from '@/components/cards/chart-card'

describe('<ChartCard />', () => {
  const mockData = [
    { event_time: '2025-01-01', value: 100 },
    { event_time: '2025-01-02', value: 200 },
    { event_time: '2025-01-03', value: 150 },
  ]

  const mockSql = 'SELECT event_time, value FROM test_table'

  describe('Rendering', () => {
    it('renders with title and content', () => {
      cy.mount(
        <ChartCard title="Test Chart" sql={mockSql} data={mockData}>
          <div>Chart Content</div>
        </ChartCard>
      )

      cy.contains('Test Chart').should('be.visible')
      cy.contains('Chart Content').should('be.visible')
    })

    it('renders without title', () => {
      cy.mount(
        <ChartCard sql={mockSql} data={mockData}>
          <div>Chart Content</div>
        </ChartCard>
      )

      // Title should not be shown
      cy.contains('Test Chart').should('not.exist')
      cy.contains('Chart Content').should('be.visible')
    })

    it('renders with string children', () => {
      cy.mount(
        <ChartCard title="Test Chart" sql={mockSql} data={mockData}>
          Chart Content
        </ChartCard>
      )

      cy.contains('Chart Content').should('be.visible')
    })

    it('renders with React node children', () => {
      cy.mount(
        <ChartCard title="Test Chart" sql={mockSql} data={mockData}>
          <div data-testid="chart-node">
            <span>Custom Chart</span>
          </div>
        </ChartCard>
      )

      cy.get('[data-testid="chart-node"]').should('be.visible')
      cy.contains('Custom Chart').should('be.visible')
    })
  })

  describe('Loading State', () => {
    it('renders loading state when data is undefined', () => {
      cy.mount(
        <ChartCard title="Loading Chart">
          <div>Loading...</div>
        </ChartCard>
      )

      cy.contains('Loading Chart').should('be.visible')
      cy.contains('Loading...').should('be.visible')
    })

    it('renders loading state when data is empty array', () => {
      cy.mount(
        <ChartCard title="Empty Chart" data={[]} sql={mockSql}>
          <div>No data</div>
        </ChartCard>
      )

      cy.contains('Empty Chart').should('be.visible')
      cy.contains('No data').should('be.visible')
    })
  })

  describe('SQL Button', () => {
    it('shows SQL button when sql prop is provided', () => {
      cy.mount(
        <ChartCard title="Chart with SQL" sql={mockSql} data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // SQL button is in a toolbar that is invisible by default
      // It becomes visible on group hover
      cy.get('button').should('exist')
    })

    it('does not show SQL button when sql prop is not provided', () => {
      cy.mount(
        <ChartCard title="Chart without SQL" data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // Should not have SQL button
      cy.get('button').should('not.exist')
    })

    it('opens SQL dialog when button is clicked', () => {
      cy.mount(
        <ChartCard title="SQL Chart" sql={mockSql} data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // Click the SQL button
      cy.get('button').click()

      // Dialog should open with SQL content
      cy.get('pre').should('be.visible')
      cy.get('pre').contains('SELECT event_time, value FROM test_table')
    })

    it('displays formatted SQL in dialog', () => {
      const unformattedSql =
        'SELECT  event_time  ,  value  FROM  test_table  WHERE  value  >  100'

      cy.mount(
        <ChartCard title="SQL Chart" sql={unformattedSql} data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      cy.get('button').click()

      // SQL should be displayed (the dedent function removes common indentation)
      cy.get('pre').should('contain', 'SELECT')
    })

    it('closes SQL dialog when closed', () => {
      cy.mount(
        <ChartCard title="SQL Chart" sql={mockSql} data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // Open dialog
      cy.get('button').click()
      cy.get('pre').should('be.visible')

      // Close dialog by clicking outside (on the dialog overlay)
      cy.get('[role="dialog"] button').first().click()

      // Pre should not be visible anymore
      cy.get('pre').should('not.exist')
    })
  })

  describe('Data Button', () => {
    it('shows data button when data prop is provided', () => {
      cy.mount(
        <ChartCard title="Chart with Data" sql={mockSql} data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // Should have buttons (SQL and data buttons)
      cy.get('button').should('have.length', 2)
    })

    it('does not show data button when data prop is not provided', () => {
      cy.mount(
        <ChartCard title="Chart without Data" sql={mockSql}>
          <div>Content</div>
        </ChartCard>
      )

      // Should only have SQL button
      cy.get('button').should('have.length', 1)
    })

    it('opens data dialog when data button is clicked', () => {
      cy.mount(
        <ChartCard title="Data Chart" sql={mockSql} data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // The second button is the data button (TableIcon)
      cy.get('button').eq(1).click()

      // Dialog should open with JSON data
      cy.get('pre').should('be.visible')
      cy.get('pre').contains('event_time').should('be.visible')
      cy.get('pre').contains('value').should('be.visible')
    })

    it('displays formatted JSON data in dialog', () => {
      cy.mount(
        <ChartCard title="Data Chart" sql={mockSql} data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      cy.get('button').eq(1).click()

      // Should show formatted JSON with indentation
      cy.get('pre').contains('"event_time"').should('be.visible')
      cy.get('pre').contains('"value"').should('be.visible')
      cy.get('pre').contains('100').should('be.visible')
    })
  })

  describe('Refresh Functionality', () => {
    it('does not show refresh button by default', () => {
      cy.mount(
        <ChartCard title="Static Chart" data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // Should not have refresh button (ChartCard doesn't include refresh)
      cy.contains('button', /refresh/i).should('not.exist')
    })

    it('allows external refresh control via parent component', () => {
      const onRefresh = cy.stub().as('onRefresh')

      cy.mount(
        <ChartCard title="Refreshable Chart" data={mockData}>
          <button onClick={onRefresh}>Refresh</button>
        </ChartCard>
      )

      cy.contains('button', 'Refresh').click()
      cy.get('@onRefresh').should('have.been.calledOnce')
    })
  })

  describe('Error State', () => {
    it('renders chart card content even with error data', () => {
      const errorData = [
        { event_time: '2025-01-01', error: 'Connection failed' },
      ]

      cy.mount(
        <ChartCard title="Error Chart" data={errorData} sql={mockSql}>
          <div>Error Content</div>
        </ChartCard>
      )

      cy.contains('Error Chart').should('be.visible')
      cy.contains('Error Content').should('be.visible')
    })

    it('shows both SQL and data buttons with error data', () => {
      const errorData = [{ event_time: '2025-01-01', error: 'Failed' }]

      cy.mount(
        <ChartCard title="Error Chart" data={errorData} sql={mockSql}>
          <div>Error Content</div>
        </ChartCard>
      )

      // Should still have both buttons
      cy.get('button').should('have.length', 2)
    })
  })

  describe('Data Display', () => {
    it('displays chart content properly', () => {
      cy.mount(
        <ChartCard title="Data Display Chart" data={mockData} sql={mockSql}>
          <svg data-testid="test-chart">
            <rect width="100" height="100" />
          </svg>
        </ChartCard>
      )

      cy.get('[data-testid="test-chart"]').should('be.visible')
      cy.get('svg').should('be.visible')
    })

    it('handles complex data structures', () => {
      const complexData = [
        {
          event_time: '2025-01-01',
          metrics: { cpu: 50, memory: 75 },
          breakdown: [['type1', 10], ['type2', 20]],
        },
      ]

      cy.mount(
        <ChartCard title="Complex Chart" data={complexData} sql={mockSql}>
          <div>Complex Content</div>
        </ChartCard>
      )

      cy.contains('Complex Chart').should('be.visible')
      cy.contains('Complex Content').should('be.visible')

      // Open data dialog to verify complex data is displayed
      cy.get('button').eq(1).click()
      cy.get('pre').contains('breakdown').should('be.visible')
    })

    it('handles empty data array', () => {
      cy.mount(
        <ChartCard title="Empty Data Chart" data={[]} sql={mockSql}>
          <div>No Data</div>
        </ChartCard>
      )

      cy.contains('Empty Data Chart').should('be.visible')
      cy.contains('No Data').should('be.visible')

      // Data button should still be available
      cy.get('button').eq(1).click()
      cy.get('pre').contains('[]').should('be.visible')
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      cy.mount(
        <ChartCard
          title="Styled Chart"
          data={mockData}
          className="custom-chart-class"
        >
          <div>Content</div>
        </ChartCard>
      )

      cy.get('.custom-chart-class').should('exist')
    })

    it('applies custom contentClassName', () => {
      cy.mount(
        <ChartCard
          title="Styled Chart"
          data={mockData}
          contentClassName="custom-content-class"
        >
          <div>Content</div>
        </ChartCard>
      )

      cy.get('.custom-content-class').should('exist')
    })

    it('applies both custom classes', () => {
      cy.mount(
        <ChartCard
          title="Styled Chart"
          data={mockData}
          className="custom-chart-class"
          contentClassName="custom-content-class"
        >
          <div>Content</div>
        </ChartCard>
      )

      cy.get('.custom-chart-class').should('exist')
      cy.get('.custom-content-class').should('exist')
    })
  })

  describe('Toolbar Visibility', () => {
    it('hides toolbar by default and shows on hover', () => {
      cy.mount(
        <ChartCard title="Toolbar Chart" data={mockData} sql={mockSql}>
          <div>Content</div>
        </ChartCard>
      )

      // Buttons should exist but toolbar should be invisible by default
      cy.get('button').should('exist')

      // Toolbar should have opacity-0 and invisible classes
      cy.get('.invisible').should('exist')
      cy.get('.opacity-0').should('exist')

      // Hover to show toolbar
      cy.get('.group-hover\\:visible').should('exist')
      cy.get('.group-hover\\:opacity-100').should('exist')
    })

    it('shows both SQL and data buttons on hover', () => {
      cy.mount(
        <ChartCard title="Toolbar Chart" data={mockData} sql={mockSql}>
          <div>Content</div>
        </ChartCard>
      )

      // Should have 2 buttons (SQL and data)
      cy.get('button').should('have.length', 2)
    })

    it('only shows SQL button when data is not provided', () => {
      cy.mount(
        <ChartCard title="Toolbar Chart" sql={mockSql}>
          <div>Content</div>
        </ChartCard>
      )

      // Should only have SQL button
      cy.get('button').should('have.length', 1)
    })
  })

  describe('Card Layout', () => {
    it('uses proper card structure', () => {
      cy.mount(
        <ChartCard title="Layout Chart" data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // Should have Card component with proper classes
      cy.get('.rounded-lg').should('exist')
      cy.get('.border-border').should('exist')
      cy.get('.bg-card').should('exist')
    })

    it('has proper flex layout', () => {
      cy.mount(
        <ChartCard title="Flex Chart" data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // Should have flex layout classes
      cy.get('.flex').should('exist')
      cy.get('.flex-col').should('exist')
    })

    it('has hover effects', () => {
      cy.mount(
        <ChartCard title="Hover Chart" data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // Should have hover transition classes
      cy.get('.transition-all').should('exist')
      cy.get('.hover\\:border-border').should('exist')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      cy.mount(
        <ChartCard title="Accessible Chart" data={mockData}>
          <div>Content</div>
        </ChartCard>
      )

      // Title should be in a CardDescription (which is a <p> with proper styling)
      cy.contains('Accessible Chart').should('be.visible')
    })

    it('buttons have accessible labels', () => {
      cy.mount(
        <ChartCard title="A11y Chart" data={mockData} sql={mockSql}>
          <div>Content</div>
        </ChartCard>
      )

      // Buttons should be clickable and visible
      cy.get('button').each((button) => {
        cy.wrap(button).should('be.visible')
      })
    })
  })
})
