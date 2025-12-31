/**
 * Tests for app-specific sidebar hooks
 */

import { act, renderHook, waitFor } from '@jest/globals'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'

// Mock the mobile/tablet detection hooks
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

jest.mock('@/hooks/use-tablet', () => ({
  useIsTablet: jest.fn(() => false),
}))

import { useIsMobile } from '@/hooks/use-mobile'
import { useIsTablet } from '@/hooks/use-tablet'
import { useAppSidebarState, useAppSidebarKeyboard } from '../hooks'

describe('components/layout/hooks', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
    jest.clearAllMocks()
  })

  describe('useAppSidebarState', () => {
    it('should initialize with defaultOpen state', () => {
      const { result } = renderHook(() =>
        useAppSidebarState({ defaultOpen: true })
      )

      expect(result.current.open).toBe(true)
      expect(result.current.openMobile).toBe(false)
      expect(result.current.isMobile).toBe(false)
    })

    it('should initialize with closed state when defaultOpen is false', () => {
      const { result } = renderHook(() =>
        useAppSidebarState({ defaultOpen: false })
      )

      expect(result.current.open).toBe(false)
    })

    it('should toggle sidebar state', () => {
      const { result } = renderHook(() =>
        useAppSidebarState({ defaultOpen: true })
      )

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.open).toBe(false)
    })

    it('should toggle mobile state when isMobile is true', () => {
      ;(useIsMobile as jest.Mock).mockReturnValue(true)

      const { result } = renderHook(() =>
        useAppSidebarState({ defaultOpen: true })
      )

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.openMobile).toBe(true)
      expect(result.current.open).toBe(true) // Desktop state unchanged
    })

    it('should persist state to localStorage', () => {
      const { result } = renderHook(() =>
        useAppSidebarState({ defaultOpen: true })
      )

      act(() => {
        result.current.setOpen(false)
      })

      if (typeof window !== 'undefined') {
        expect(localStorage.getItem('clickhouse-monitor:sidebar:state')).toBe(
          'false'
        )
      }
    })

    it('should restore state from localStorage on mount', async () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('clickhouse-monitor:sidebar:state', 'false')
      }

      const { result } = renderHook(() =>
        useAppSidebarState({ defaultOpen: true })
      )

      // Wait for useEffect to run
      await waitFor(() => {
        expect(result.current.open).toBe(false)
      })
    })

    it('should auto-collapse on tablet screens', async () => {
      ;(useIsTablet as jest.Mock).mockReturnValue(true)

      const { result } = renderHook(() =>
        useAppSidebarState({ defaultOpen: true })
      )

      await waitFor(() => {
        expect(result.current.open).toBe(false)
      })
    })

    it('should call onOpenChange callback when state changes', () => {
      const onOpenChange = jest.fn()

      const { result } = renderHook(() =>
        useAppSidebarState({ defaultOpen: true, onOpenChange })
      )

      act(() => {
        result.current.setOpen(false)
      })

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('should use controlled state when open prop is provided', () => {
      const { result } = renderHook(() =>
        useAppSidebarState({ defaultOpen: true, open: false })
      )

      expect(result.current.open).toBe(false) // Uses controlled prop
    })
  })

  describe('useAppSidebarKeyboard', () => {
    it('should attach keyboard event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const toggleSidebar = jest.fn()

      renderHook(() => useAppSidebarKeyboard(toggleSidebar, 'b'))

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })

    it('should remove keyboard event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const toggleSidebar = jest.fn()

      const { unmount } = renderHook(() =>
        useAppSidebarKeyboard(toggleSidebar, 'b')
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })

    it('should call toggleSidebar on Cmd/Ctrl+B key press', () => {
      const toggleSidebar = jest.fn()

      renderHook(() => useAppSidebarKeyboard(toggleSidebar, 'b'))

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
      })

      act(() => {
        window.dispatchEvent(event)
      })

      expect(toggleSidebar).toHaveBeenCalled()
    })

    it('should call toggleSidebar on Ctrl+B key press', () => {
      const toggleSidebar = jest.fn()

      renderHook(() => useAppSidebarKeyboard(toggleSidebar, 'b'))

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
      })

      act(() => {
        window.dispatchEvent(event)
      })

      expect(toggleSidebar).toHaveBeenCalled()
    })

    it('should not call toggleSidebar for other keys', () => {
      const toggleSidebar = jest.fn()

      renderHook(() => useAppSidebarKeyboard(toggleSidebar, 'b'))

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        metaKey: true,
      })

      act(() => {
        window.dispatchEvent(event)
      })

      expect(toggleSidebar).not.toHaveBeenCalled()
    })

    it('should not call toggleSidebar without modifier key', () => {
      const toggleSidebar = jest.fn()

      renderHook(() => useAppSidebarKeyboard(toggleSidebar, 'b'))

      const event = new KeyboardEvent('keydown', {
        key: 'b',
      })

      act(() => {
        window.dispatchEvent(event)
      })

      expect(toggleSidebar).not.toHaveBeenCalled()
    })

    it('should use custom shortcut key when provided', () => {
      const toggleSidebar = jest.fn()

      renderHook(() => useAppSidebarKeyboard(toggleSidebar, 's'))

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
      })

      act(() => {
        window.dispatchEvent(event)
      })

      expect(toggleSidebar).toHaveBeenCalled()
    })

    it('should prevent default on shortcut key press', () => {
      const toggleSidebar = jest.fn()
      const preventDefaultSpy = jest.fn()

      renderHook(() => useAppSidebarKeyboard(toggleSidebar, 'b'))

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
      })
      Object.defineProperty(event, 'preventDefault', {
        value: preventDefaultSpy,
        writable: true,
      })

      act(() => {
        window.dispatchEvent(event)
      })

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })
})
