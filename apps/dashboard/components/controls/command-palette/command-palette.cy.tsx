import { CommandPalette } from '../command-palette'

const searchInput = 'input[aria-label="Search commands"]'

describe('<CommandPalette />', () => {
  it('renders the search command list when open', () => {
    cy.mount(<CommandPalette open />)

    cy.get(searchInput).should('be.visible')
    cy.contains('[cmdk-item]', 'Overview').should('exist')
    cy.get('[cmdk-group-heading]').should('exist')
  })

  it('filters menu items based on search', () => {
    cy.mount(<CommandPalette open />)

    cy.get(searchInput).type('Overview')

    cy.contains('[cmdk-item]', 'Overview').should('exist')
  })

  it('shows empty state when no matches', () => {
    cy.mount(<CommandPalette open />)

    cy.get(searchInput).type('xyznonexistent')

    cy.contains('No results found.').should('exist')
  })

  it('opens with the keyboard shortcut', () => {
    cy.mount(<CommandPalette />)

    cy.get('body').type('{meta}{k}')

    cy.get(searchInput).should('be.visible')
  })

  it('preserves host parameter in navigation URL', () => {
    cy.mount(<CommandPalette open />)

    cy.contains('[cmdk-item]', 'Overview').click()

    cy.get('@appRouter:push').should('have.been.calledWithMatch', /host=/)
  })

  it('calls onOpenChange when escape closes a controlled dialog', () => {
    const onOpenChange = cy.stub().as('onOpenChange')

    cy.mount(<CommandPalette open onOpenChange={onOpenChange} />)

    cy.get(searchInput).type('{esc}')

    cy.get('@onOpenChange').should('have.been.calledWith', false)
  })
})
