import { CodeDialogFormat } from './code-dialog-format'

describe('<CodeDialogFormat />', () => {
  it('renders short code without dialog', () => {
    const shortCode = 'SELECT * FROM table'
    cy.mount(<CodeDialogFormat value={shortCode} />)
    cy.get('code').should('contain.text', shortCode)
    cy.get('svg[role="open-dialog"]').should('not.exist')
  })

  it('renders long code with dialog', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeDialogFormat value={longCode} />)
    cy.get('code').should('exist')
    cy.get('svg[role="open-dialog"]').should('exist')
  })

  it('opens dialog on button click', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    cy.mount(<CodeDialogFormat value={longCode} />)
    cy.get('svg[role="open-dialog"]').click()
    cy.get('div[role="dialog"]').should('be.visible')
    cy.get('div[role="dialog"] code').should('contain.text', longCode)
  })

  it('renders with custom options', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    const options = {
      dialog_title: 'Custom Title',
      dialog_description: 'Custom Description',
      max_truncate: 20,
      hide_query_comment: true,
    }
    cy.mount(<CodeDialogFormat value={longCode} options={options} />)
    cy.get('svg[role="open-dialog"]').click()
    cy.get('div[role="dialog"]').within(() => {
      cy.contains('Custom Title').should('be.visible')
      cy.contains('Custom Description').should('be.visible')
    })
  })

  it('truncates code based on max_truncate option', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    const options = { max_truncate: 20 }
    cy.mount(<CodeDialogFormat value={longCode} options={options} />)
    cy.get('code')
      .invoke('text')
      .should('have.length', 20 + 3 /* 3 chars "..." */)
  })

  it('hides query comment when hide_query_comment is true', () => {
    const codeWithComment = '/* This is a comment */ SELECT * FROM table'
    const options = { hide_query_comment: true, max_truncate: 100 }
    cy.mount(<CodeDialogFormat value={codeWithComment} options={options} />)
    cy.get('code').should('not.contain', '/* This is a comment */')
  })
})
