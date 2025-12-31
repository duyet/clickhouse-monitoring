/**
 * Tests for AppSidebarProvider component
 */

import { expect, jest } from '@jest/globals'
import { beforeEach, describe, it } from '@jest/globals'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { AppSidebarProvider } from '../app-sidebar-provider'
import { SidebarContext } from '@/components/ui/sidebar/context'

// Mock the hooks
jest.mock('../hooks/use-app-sidebar-state', () => ({
  useAppSidebarState: jest.fn(() => ({
    open: true,
    setOpen: jest.fn(),
    openMobile: false,
    setOpenMobile: jest.fn(),
    isMobile: false,
    toggleSidebar: jest.fn(),
  })),
}))

jest.mock('../hooks/use-app-sidebar-keyboard', () => ({
  useAppSidebarKeyboard: jest.fn(),
}))

describe('components/layout/app-sidebar-provider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children with sidebar context', () => {
    const TestChild = () => {
      const context = React.useContext(SidebarContext)
      return (
        <div data-testid="context-value">
          {context ? 'has-context' : 'no-context'}
        </div>
      )
    }

    render(
      <AppSidebarProvider>
        <TestChild />
      </AppSidebarProvider>
    )

    expect(screen.getByTestId('context-value')).toHaveTextContent('has-context')
  })

  it('should provide default context values', () => {
    const TestChild = () => {
      const context = React.useContext(SidebarContext)
      return (
        <div>
          <span data-testid="state">{context?.state}</span>
          <span data-testid="open">{context?.open ? 'true' : 'false'}</span>
        </div>
      )
    }

    render(
      <AppSidebarProvider>
        <TestChild />
      </AppSidebarProvider>
    )

    expect(screen.getByTestId('state')).toHaveTextContent('expanded')
    expect(screen.getByTestId('open')).toHaveTextContent('true')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <AppSidebarProvider className="custom-class">
        <div>Child</div>
      </AppSidebarProvider>
    )

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-class')
  })

  it('should set CSS variable for sidebar width', () => {
    const { container } = render(
      <AppSidebarProvider>
        <div>Child</div>
      </AppSidebarProvider>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.getPropertyValue('--sidebar-width')).toBe('16rem')
  })

  it('should apply default wrapper classes', () => {
    const { container } = render(
      <AppSidebarProvider>
        <div>Child</div>
      </AppSidebarProvider>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('group/sidebar-wrapper')
    expect(wrapper).toHaveClass('flex')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()

    render(
      <AppSidebarProvider ref={ref}>
        <div>Child</div>
      </AppSidebarProvider>
    )

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
