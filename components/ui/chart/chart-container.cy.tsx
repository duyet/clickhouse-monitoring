import { ChartContainer } from './chart-container'

describe('<ChartContainer />', () => {
  const config = {
    value: {
      label: 'Value',
      color: 'hsl(var(--chart-1))',
    },
  }

  it('renders container with data-chart attribute', () => {
    cy.mount(
      <ChartContainer config={config}>
        <div data-testid="test-chart">Chart Content</div>
      </ChartContainer>
    )

    cy.get('[data-slot="chart"]').should('exist')
    cy.get('[data-chart]').should('exist')
    cy.contains('Chart Content').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartContainer config={config} className="custom-class">
        <div>Chart</div>
      </ChartContainer>
    )

    cy.get('.custom-class').should('exist')
  })

  it('passes id through to data-chart attribute', () => {
    cy.mount(
      <ChartContainer id="my-chart" config={config}>
        <div>Chart</div>
      </ChartContainer>
    )

    cy.get('[data-chart="my-chart"]').should('exist')
  })
})
