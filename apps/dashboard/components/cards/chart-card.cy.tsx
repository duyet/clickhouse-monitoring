import { ChartCard } from './chart-card'

describe('<ChartCard />', () => {
  it('renders', () => {
    cy.mount(
      <ChartCard title="title">
        <div>content</div>
      </ChartCard>
    )

    cy.contains('title')
    cy.contains('content')
  })

  it('renders without title', () => {
    cy.mount(
      <ChartCard>
        <div>content</div>
      </ChartCard>
    )

    cy.contains('content')
  })

  it('renders with string children', () => {
    cy.mount(<ChartCard>content</ChartCard>)

    cy.contains('content')
  })
})
