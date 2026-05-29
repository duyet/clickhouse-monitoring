import { HoverCardFormat } from './hover-card-format'

describe('<HoverCardFormat />', () => {
  it('should display content', () => {
    const row = { getValue: (key: string) => `value-for-${key}` }
    const value = 'Hover me'
    const options = { content: 'Hover content: [column_name]' }

    cy.mount(<HoverCardFormat row={row} value={value} options={options} />)
    cy.contains('Hover me').should('be.visible')
  })

  it('should display hover content correctly', () => {
    const row = { getValue: (key: string) => `value-for-${key}` }
    const value = 'Hover me'
    const options = { content: 'Hover content: [column_name]' }

    cy.mount(<HoverCardFormat row={row} value={value} options={options} />)

    cy.contains('Hover me').realHover()
    cy.contains('Hover content: value-for-column_name').should('be.visible')
  })

  it('should display hover content correctly for ReactNode content', () => {
    const row = { getValue: (key: string) => `value-for-${key}` }
    const value = 'Hover me'
    const options = {
      content: <div id="hover-content">Hover content: [column_name]</div>,
    }

    cy.mount(<HoverCardFormat row={row} value={value} options={options} />)

    cy.contains('Hover me').realHover()
    cy.get('div#hover-content')
      .contains('Hover content: value-for-column_name')
      .should('be.visible')
  })
})
