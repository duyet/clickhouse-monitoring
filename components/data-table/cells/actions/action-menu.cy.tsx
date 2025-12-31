import { ActionMenu } from './action-menu'
import type { Row, RowData } from '@tanstack/react-table'

describe('<ActionMenu />', () => {
  const mockRow = {
    index: 0,
    getIsExpanded: cy.stub().returns(false),
    toggleExpanded: cy.stub(),
  } as unknown as Row<RowData>

  const mockActions = ['kill-query', 'explain-query']

  beforeEach(() => {
    cy.stub(console, 'error').as('consoleError')
  })

  it('renders menu button with trigger', () => {
    cy.mount(
      <ActionMenu row={mockRow} value="test-value" actions={mockActions} />
    )

    cy.get('button[aria-label="Open menu"]').should('be.visible')
    cy.findByLabelText('Open menu')
      .should('have.attr', 'type', 'button')
      .and('have.class', 'p-0')
  })

  it('opens dropdown menu on click', () => {
    cy.mount(
      <ActionMenu row={mockRow} value="test-value" actions={mockActions} />
    )

    cy.get('button[aria-label="Open menu"]').click()
    cy.contains('Actions').should('be.visible')
    cy.contains('Kill Query').should('be.visible')
    cy.contains('Explain Query').should('be.visible')
  })

  it('renders all provided actions', () => {
    const actions = ['kill-query', 'explain-query', 'optimize', 'query-settings']

    cy.mount(
      <ActionMenu row={mockRow} value="test-value" actions={actions} />
    )

    cy.get('button[aria-label="Open menu"]').click()

    cy.contains('Kill Query').should('be.visible')
    cy.contains('Explain Query').should('be.visible')
    cy.contains('Optimize Table').should('be.visible')
    cy.contains('Query Settings').should('be.visible')
  })

  it('has accessible menu trigger with screen reader label', () => {
    cy.mount(
      <ActionMenu row={mockRow} value="test-value" actions={mockActions} />
    )

    cy.get('.sr-only').contains('Open menu').should('be.visible')
  })

  it('uses MoreHorizontal icon', () => {
    cy.mount(
      <ActionMenu row={mockRow} value="test-value" actions={mockActions} />
    )

    cy.get('button[aria-label="Open menu"]')
      .find('svg')
      .should('have.class', 'lucide-more-horizontal')
  })

  it('has correct button variant styling', () => {
    cy.mount(
      <ActionMenu row={mockRow} value="test-value" actions={mockActions} />
    )

    cy.get('button').should('have.class', 'variant-ghost')
  })

  it('handles empty actions array', () => {
    cy.mount(<ActionMenu row={mockRow} value="test-value" actions={[]} />)

    cy.get('button[aria-label="Open menu"]').click()
    cy.contains('Actions').should('be.visible')
  })

  it('has dropdown menu aligned to end', () => {
    cy.mount(
      <ActionMenu row={mockRow} value="test-value" actions={mockActions} />
    )

    cy.get('button[aria-label="Open menu"]').click()
    cy.get('[role="menu"]').should('have.attr', 'data-align', 'end')
  })

  it('includes menu separator', () => {
    cy.mount(
      <ActionMenu row={mockRow} value="test-value" actions={mockActions} />
    )

    cy.get('button[aria-label="Open menu"]').click()
    cy.get('[role="separator"]').should('be.visible')
  })
})
