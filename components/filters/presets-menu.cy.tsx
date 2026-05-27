import { PresetsMenu } from './presets-menu'

describe('PresetsMenu', () => {
  const presets = [
    { name: 'Slow queries', filters: [] },
    { name: 'Failed queries', filters: [] },
  ]

  it('renders the Presets trigger button', () => {
    cy.mount(<PresetsMenu presets={presets} onApply={cy.stub()} />)
    cy.contains('button', 'Presets').should('exist')
  })

  it('opens the menu and lists each preset by name', () => {
    cy.mount(<PresetsMenu presets={presets} onApply={cy.stub()} />)
    cy.contains('button', 'Presets').click()

    cy.contains('Slow queries').should('be.visible')
    cy.contains('Failed queries').should('be.visible')
  })

  it('invokes onApply with the chosen preset object', () => {
    const onApply = cy.stub().as('onApply')
    cy.mount(<PresetsMenu presets={presets} onApply={onApply} />)

    cy.contains('button', 'Presets').click()
    cy.contains('Slow queries').click()

    cy.get('@onApply').should('have.been.calledOnceWith', presets[0])
  })

  it('renders nothing extra when given an empty preset list', () => {
    cy.mount(<PresetsMenu presets={[]} onApply={cy.stub()} />)
    cy.contains('button', 'Presets').click()

    // No menu items rendered, but the trigger should still exist.
    cy.get('[role="menuitem"]').should('not.exist')
  })
})
