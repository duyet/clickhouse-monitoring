import { CodeToggleFormat } from './code-toggle-format'
import type { Row } from '@tanstack/react-table'

describe('<CodeToggleFormat />', () => {
  const mockRow = {
    index: 0,
    getIsExpanded: cy.stub().returns(false),
    toggleExpanded: cy.stub(),
  } as unknown as Row<any>

  it('renders short code without accordion', () => {
    const shortCode = 'SELECT * FROM table'
    cy.mount(<CodeToggleFormat row={mockRow} value={shortCode} />)

    cy.get('code').should('contain.text', shortCode)
    cy.get('[data-radix-accordion-item]').should('not.exist')
  })

  it('renders long code with accordion', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} />)

    cy.get('[data-radix-accordion-item]').should('exist')
    cy.get('code').should('contain.text', '...')
  })

  it('truncates code based on default length', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} />)

    cy.get('code')
      .invoke('text')
      .should('have.length.lessThan', longCode.length)
  })

  it('truncates code based on custom max_truncate option', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    const options = { max_truncate: 20 }
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} options={options} />)

    cy.get('code')
      .invoke('text')
      .should('have.length.at.most', 20 + 3) // 3 chars for "..."
  })

  it('hides query comment when hide_query_comment is true', () => {
    const codeWithComment = '/* This is a comment */ SELECT * FROM table'
    const options = { hide_query_comment: true, max_truncate: 100 }
    cy.mount(<CodeToggleFormat row={mockRow} value={codeWithComment} options={options} />)

    cy.get('code').should('not.contain', '/* This is a comment */')
  })

  it('toggles accordion on click', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} />)

    // Initially collapsed
    cy.get('code').should('contain.text', '...')

    // Click to expand
    cy.get('[data-radix-accordion-trigger]').click()
    cy.get('[data-radix-accordion-content]').should('be.visible')
    cy.get('[data-radix-accordion-content] code').should('contain.text', longCode)
  })

  it('shows full code in accordion content', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} />)

    cy.get('[data-radix-accordion-trigger]').click()
    cy.get('[data-radix-accordion-content] code').should('contain.text', longCode)
  })

  it('has accessible accordion trigger', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} />)

    cy.get('[data-radix-accordion-trigger]').should('have.attr', 'type', 'button')
  })

  it('calls row.toggleExpanded when accordion value changes', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    const toggleExpanded = cy.stub().as('toggleExpanded')

    const rowWithStub = {
      index: 0,
      getIsExpanded: cy.stub().returns(false),
      toggleExpanded,
    } as unknown as Row<any>

    cy.mount(<CodeToggleFormat row={rowWithStub} value={longCode} />)

    cy.get('[data-radix-accordion-trigger]').click()
    cy.get('@toggleExpanded').should('have.been.called')
  })

  it('has no border on accordion item', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} />)

    cy.get('[data-radix-accordion-item]').should('have.class', 'border-0')
  })

  it('has hover:no-underline on trigger', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} />)

    cy.get('[data-radix-accordion-trigger]').should('have.class', 'hover:no-underline')
  })

  it('uses line-clamp-2 and truncate on code', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} />)

    cy.get('[data-radix-accordion-trigger] code')
      .should('have.class', 'line-clamp-2')
      .and('have.class', 'truncate')
  })

  it('has proper styling for accordion content code', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeToggleFormat row={mockRow} value={longCode} />)

    cy.get('[data-radix-accordion-trigger]').click()
    cy.get('[data-radix-accordion-content] code')
      .should('have.class', 'text-stone-500')
      .and('have.class', 'whitespace-pre-wrap')
  })

  it('handles empty string value', () => {
    cy.mount(<CodeToggleFormat row={mockRow} value="" />)

    cy.get('code').should('contain.text', '')
  })

  it('handles null value gracefully', () => {
    cy.mount(<CodeToggleFormat row={mockRow} value={null as unknown as string} />)

    // Should render something without crashing
    cy.get('code').should('exist')
  })
})
