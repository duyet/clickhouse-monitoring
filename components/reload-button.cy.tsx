import React from 'react'

import { ReloadButton } from './reload-button'

describe('<ReloadButton />', () => {
  context('mocking router', () => {
    beforeEach(() => {})

    it('renders', () => {
      cy.mount(<ReloadButton />)
    })
  })
})
