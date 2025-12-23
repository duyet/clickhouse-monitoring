import { NumberChart } from './number'

describe('<NumberChart />', () => {
  const mockData = [
    {
      value: 100,
      name: 'Test Name',
    },
  ]

  it('renders correctly with data', () => {
    cy.mount(<NumberChart data={mockData} nameKey="name" dataKey="value" />)
    cy.get('div').contains('100').should('be.visible')
    cy.get('div').contains('Test Name').should('not.exist')
  })

  it('renders without legend when showLabel is false', () => {
    cy.mount(
      <NumberChart
        data={mockData}
        nameKey="name"
        dataKey="value"
        showLabel={false}
      />
    )
    cy.get('div').contains('Test Name').should('not.exist')
  })

  it('renders with showLabel ', () => {
    cy.mount(
      <NumberChart data={mockData} nameKey="name" dataKey="value" showLabel />
    )
    cy.get('div').contains('Test Name').should('be.visible')
  })

  it('handles empty data gracefully', () => {
    cy.mount(<NumberChart data={[]} nameKey="name" dataKey="value" />)
    cy.contains('No data').should('be.visible')
  })

  it('renders without data', () => {
    cy.mount(<NumberChart data={[]} dataKey="value" nameKey="name" />)
    cy.contains('No data').should('be.visible')
  })

  it('renders with title', () => {
    cy.mount(
      <NumberChart
        data={mockData}
        dataKey="value"
        nameKey="name"
        showLabel
        title="Walking Distance"
        className="max-w-[300px] rounded border"
      />
    )
    cy.get('[role="title"]').should('be.visible')
  })

  it('renders with title and description', () => {
    cy.mount(
      <NumberChart
        data={mockData}
        dataKey="value"
        nameKey="name"
        showLabel
        title="Walking Distance"
        description="Over the last 7 days, your distance walked and run was 12.5 miles per day."
        className="max-w-[300px] rounded border"
      />
    )
    cy.get('[role="title"]').should('be.visible')
    cy.get('[role="description"]').should('be.visible')
  })
})
