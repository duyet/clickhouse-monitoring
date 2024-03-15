import Loading from './loading'

describe('<Loading />', () => {
  it('should render loading', () => {
    cy.mount(<Loading />)
    cy.get('div').contains('loading', { matchCase: false })
  })
})
