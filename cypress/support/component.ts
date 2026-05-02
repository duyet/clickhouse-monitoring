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

import { SWRConfig } from 'swr'

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import { mount } from 'cypress/react'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import {
  PathnameContext,
  SearchParamsContext,
} from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
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
      createElement(
        AppRouterContext.Provider,
        {
          value: {
            back: cy.stub().as('appRouter:back'),
            forward: cy.stub().as('appRouter:forward'),
            refresh: cy.stub().as('appRouter:refresh'),
            push: cy.stub().as('appRouter:push'),
            replace: cy.stub().as('appRouter:replace'),
            prefetch: cy.stub().as('appRouter:prefetch'),
          } satisfies AppRouterInstance,
        },
        createElement(
          PathnameContext.Provider,
          { value: '/' },
          createElement(
            SearchParamsContext.Provider,
            { value: new URLSearchParams('host=0') },
            createElement(
              SWRConfig,
              {
                value: {
                  provider: () => new Map(),
                  dedupingInterval: 0,
                  errorRetryCount: 0,
                  revalidateOnFocus: false,
                  revalidateOnReconnect: false,
                },
              },
              createElement(TooltipProvider, { delayDuration: 0 }, component)
            )
          )
        )
      )
    ),
    options
  )
})
Cypress.Commands.add('nextMount', nextMount)

beforeEach(() => {
  cy.intercept('GET', '/api/v1/dashboard/settings*', {
    statusCode: 200,
    body: { success: true, data: { params: {} }, metadata: {} },
  })
})

// Example use:
// cy.mount(<MyComponent />)
// cy.nextMount(<MyComponent />)
