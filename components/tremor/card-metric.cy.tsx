import { CardMetric } from './card-metric'

describe('<CardMetric />', () => {
  it('renders 0% bar', () => {
    cy.mount(<CardMetric current={0} target={10} />)

    // Should render current value and target value
    cy.get('div').contains('0')
    cy.get('div').contains('10')

    // Tremor bar should be 0% filled
    cy.get('.tremor-ProgressBar-progressBar')
      .should('have.attr', 'style')
      .and('include', '0%')
  })

  it('renders 10% bar', () => {
    cy.mount(<CardMetric current={1} target={10} />)

    // Should render current value and target value
    cy.get('div').contains('1')
    cy.get('div').contains('10')

    // Tremor bar should be 10% filled
    cy.get('.tremor-ProgressBar-progressBar')
      .should('have.attr', 'style')
      .and('include', '10%')
  })

  it('renders 100% bar', () => {
    cy.mount(<CardMetric current={10} target={10} />)

    // Should render current value and target value
    cy.get('div').contains('10')
    cy.get('div').contains('10')

    // Tremor bar should be 100% filled
    cy.get('.tremor-ProgressBar-progressBar')
      .should('have.attr', 'style')
      .and('include', '100%')
  })

  it('renders 1000% bar when current > target', () => {
    cy.mount(<CardMetric current={100} target={10} />)

    // Should render current value and target value
    cy.get('div').contains('100')
    cy.get('div').contains('10')

    // Tremor bar should be 1000% filled
    cy.get('.tremor-ProgressBar-progressBar')
      .should('have.attr', 'style')
      .and('include', '1000%')
  })

  it('renders 10% bar with currentReadable and targetReadable', () => {
    cy.mount(
      <CardMetric
        current={1}
        currentReadable="xx 1 xx"
        target={10}
        targetReadable="xx 10 xx"
      />
    )

    // Should render current value and target value
    cy.get('div').contains('xx 1 xx')
    cy.get('div').contains('xx 10 xx')

    // Tremor bar should be 10% filled
    cy.get('.tremor-ProgressBar-progressBar')
      .should('have.attr', 'style')
      .and('include', '10%')
  })

  it('renders with custom className', () => {
    cy.mount(
      <CardMetric
        current={1}
        target={10}
        className="custom-classname bg-cyan-400"
      />
    )

    // Tremor bar should be 10% filled
    cy.get('.bg-cyan-400.custom-classname').should('exist')
  })
})
