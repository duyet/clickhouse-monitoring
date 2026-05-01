import { ChartCard } from '@/components/cards/chart-card'

describe('<ChartCard />', () => {
  const mockData = [
    { event_time: '2025-01-01', value: 100 },
    { event_time: '2025-01-02', value: 200 },
  ]

  const mockSql = 'SELECT event_time, value FROM test_table'

  const openActions = () => {
    cy.get('button[aria-label="Open chart actions"]').click()
  }

  it('renders title and children', () => {
    cy.mount(
      <ChartCard title="Test Chart" sql={mockSql} data={mockData}>
        <div>Chart Content</div>
      </ChartCard>
    )

    cy.contains('Test Chart').should('be.visible')
    cy.contains('Chart Content').should('be.visible')
  })

  it('opens request info from the actions menu', () => {
    cy.mount(
      <ChartCard title="SQL Chart" sql={mockSql} data={mockData}>
        <div>Content</div>
      </ChartCard>
    )

    openActions()
    cy.contains('[role="menuitem"]', 'Request Info').click()

    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('SQL Query').should('be.visible')
    cy.get('pre').should('contain', 'SELECT')
  })

  it('opens raw data from the actions menu', () => {
    cy.mount(
      <ChartCard title="Data Chart" sql={mockSql} data={mockData}>
        <div>Content</div>
      </ChartCard>
    )

    openActions()
    cy.contains('[role="menuitem"]', 'Raw Data').click()

    cy.get('[role="dialog"]').should('be.visible')
    cy.get('pre').should('contain', 'event_time')
    cy.get('pre').should('contain', 'value')
  })

  it('hides raw data action when no data is provided', () => {
    cy.mount(
      <ChartCard title="SQL Only Chart" sql={mockSql}>
        <div>Content</div>
      </ChartCard>
    )

    openActions()
    cy.contains('[role="menuitem"]', 'Request Info').should('be.visible')
    cy.contains('[role="menuitem"]', 'Raw Data').should('not.exist')
  })

  it('applies custom classes', () => {
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

  it('exposes accessible toolbar controls', () => {
    cy.mount(
      <ChartCard title="A11y Chart" data={mockData} sql={mockSql}>
        <div>Content</div>
      </ChartCard>
    )

    cy.get('button[aria-label="Enable log scale"]').should('exist')
    cy.get('button[aria-label="Open chart actions"]').should('exist')
  })
})
