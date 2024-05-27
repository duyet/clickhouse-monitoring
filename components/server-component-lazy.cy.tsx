import { ServerComponentLazy } from './server-component-lazy'

describe('<ServerComponentLazy />', () => {
  it('renders <div />', () => {
    cy.mount(
      <ServerComponentLazy>
        <div />
      </ServerComponentLazy>
    )
  })

  it('renders <div /> with errorFallback string', () => {
    cy.mount(
      <ServerComponentLazy errorFallback="error">
        <div />
      </ServerComponentLazy>
    )
  })
})
