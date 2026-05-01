// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
/// <reference types="cypress" />

import '@cypress/code-coverage/support'
import 'cypress-real-events'

import { mount } from 'cypress/react'
import { createElement } from 'react'

import '../../app/globals.css'

import { TooltipProvider } from '../../components/ui/tooltip'
import { nextMount } from './nextMount'

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
      nextMount: typeof nextMount
    }
  }
}

Cypress.Commands.add('mount', (component, options) =>
  mount(
    createElement(
      'div',
      { style: { height: '500px', width: '500px' } },
      createElement(TooltipProvider, { delayDuration: 0 }, component)
    ),
    options
  )
)
Cypress.Commands.add('nextMount', nextMount)

beforeEach(() => {
  cy.intercept('GET', '/api/v1/dashboard/settings*', {
    statusCode: 200,
    body: { success: true, data: { params: {} } },
  })
  cy.intercept('GET', '/api/v1/charts/*', {
    statusCode: 200,
    delay: 25,
    body: { data: [], metadata: {} },
  })
})

// Example use:
// cy.mount(<MyComponent />)
// cy.nextMount(<MyComponent />)
