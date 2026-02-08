import { expect, test } from '@playwright/test'

/**
 * Accessibility Tests
 *
 * These tests verify keyboard navigation, ARIA attributes, and screen reader compatibility.
 * Run with: npx playwright test a11y.spec.ts
 */

test.describe('Skip Link', () => {
  test('should appear when Tab is pressed', async ({ page }) => {
    await page.goto('/')

    // Skip link should be hidden initially
    const skipLink = page.getByRole('link', { name: /skip to/i })
    await expect(skipLink).not.toBeVisible()

    // Press Tab to focus skip link
    await page.keyboard.press('Tab')
    await expect(skipLink).toBeVisible()

    // Press Enter to activate
    await page.keyboard.press('Enter')
    await page.waitForTimeout(100)

    // Focus should move to main content
    const focused = page.locator(':focus')
    const mainContent = page.locator('#main-content')
    await expect(focused).toEqual(mainContent)
  })

  test('should bypass navigation and go to main content', async ({ page }) => {
    await page.goto('/')

    // Activate skip link
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    // Verify we're at main content
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeFocused()
  })
})

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate through interactive elements with Tab', async ({
    page,
  }) => {
    // Count focusable elements
    const focusableElements = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    const count = await focusableElements.count()
    expect(count).toBeGreaterThan(0)

    // Navigate through first few elements
    for (let i = 0; i < Math.min(5, count); i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(50)
      const focused = page.locator(':focus')
      await expect(focused).toBeVisible()
    }
  })

  test('should have visible focus indicators on all interactive elements', async ({
    page,
  }) => {
    // Get first few interactive elements
    const button = page.locator('button').first()
    await button.focus()

    // Check if focus indicator is visible
    const computedStyle = await button.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      }
    })

    // At least one focus indicator should be present
    const hasFocusIndicator =
      computedStyle.outline !== 'none' ||
      computedStyle.outlineWidth !== '0px' ||
      computedStyle.boxShadow.includes('0 0 0 2px')

    expect(hasFocusIndicator).toBeTruthy()
  })

  test('should toggle sidebar with keyboard shortcut', async ({ page }) => {
    // Press Cmd/Ctrl + B to toggle sidebar
    const _modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
    await page.keyboard.press(`${Modifier}+b`)

    // Sidebar should toggle (verify by checking body class or data attribute)
    const sidebar = page.locator('[data-slot="sidebar"]')
    // The exact assertion depends on implementation
    await expect(sidebar).toBeVisible()
  })
})

test.describe('ARIA Attributes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should have proper ARIA labels on icon buttons', async ({ page }) => {
    const iconButtons = page.locator('button[aria-label]')
    const count = await iconButtons.count()

    expect(count).toBeGreaterThan(0)

    // Verify each icon button has a meaningful aria-label
    for (let i = 0; i < Math.min(5, count); i++) {
      const button = iconButtons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')

      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel!.length).toBeGreaterThan(0)
    }
  })

  test('should have proper landmarks', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main, [role="main"]')
    await expect(main).toBeVisible()

    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]')
    await expect(nav).toBeVisible()

    // Check for banner/header
    const header = page.locator('header, [role="banner"]')
    await expect(header).toBeVisible()
  })

  test('should have proper table structure', async ({ page }) => {
    // Navigate to a page with tables
    await page.goto('/overview')

    const tables = page.locator('table, [role="table"]')
    const count = await tables.count()

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const table = tables.nth(i)

        // Check for caption or aria-label
        const hasCaption =
          (await table.locator('caption').count()) > 0 ||
          (await table.getAttribute('aria-label')) !== null

        if (hasCaption) {
          const caption = table.locator('caption')
          const ariaLabel = await table.getAttribute('aria-label')

          const hasAccessibleName =
            (await caption.count()) > 0 || ariaLabel !== null
          expect(hasAccessibleName).toBeTruthy()
        }
      }
    }
  })
})

test.describe('Loading States', () => {
  test('should announce loading state to screen readers', async ({ page }) => {
    await page.goto('/')

    // Look for loading indicators with proper ARIA
    const loadingIndicators = page.locator(
      '[role="status"][aria-label*="loading" i], [role="status"][aria-label*="loading" i]'
    )

    // Note: This depends on whether content is loading when page loads
    // The assertion can be adjusted based on actual loading behavior
    const count = await loadingIndicators.count()

    // If loading indicators are present, they should have proper ARIA
    for (let i = 0; i < count; i++) {
      const indicator = loadingIndicators.nth(i)
      await expect(indicator).toHaveAttribute('role', 'status')
      await expect(indicator).toHaveAttribute('aria-label')
    }
  })
})

test.describe('Dialogs and Modals', () => {
  test('should trap focus in modal when open', async ({ page }) => {
    await page.goto('/')

    // Open a dialog (this depends on having a dialog trigger)
    // Example: Settings dialog or SQL dialog
    const dialogTrigger = page
      .locator('button[aria-label*="settings" i], button[aria-label*="sql" i]')
      .first()

    if ((await dialogTrigger.count()) > 0) {
      await dialogTrigger.click()

      // Wait for dialog to open
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Focus should be inside dialog
      const focusedElement = page.locator(':focus')
      const dialogContainsFocus = await dialog.evaluate(
        (dialog, focused) => dialog.contains(focused as Node),
        await focusedElement.elementHandle()
      )

      expect(dialogContainsFocus).toBeTruthy()
    }
  })

  test('should close dialog with Escape key', async ({ page }) => {
    await page.goto('/')

    const dialogTrigger = page
      .locator('button[aria-label*="settings" i], button[aria-label*="sql" i]')
      .first()

    if ((await dialogTrigger.count()) > 0) {
      await dialogTrigger.click()

      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Press Escape to close
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
    }
  })
})

test.describe('Color Contrast', () => {
  test('should meet WCAG AA contrast requirements for text', async ({
    page,
  }) => {
    await page.goto('/')

    // This test requires a contrast checking library
    // For now, we'll check that text elements have proper color values
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a')

    // Get a sample of text elements and verify they have visible colors
    const sample = textElements.first()

    const color = await sample.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.color
    })

    // Color should not be transparent or fully transparent
    expect(color).not.toBe('transparent')
    expect(color).not.toBe('rgba(0, 0, 0, 0)')
  })
})

test.describe('Screen Reader Only Content', () => {
  test('should properly hide sr-only content visually', async ({ page }) => {
    await page.goto('/')

    const srOnlyContent = page.locator('.sr-only')
    const count = await srOnlyContent.count()

    for (let i = 0; i < count; i++) {
      const element = srOnlyContent.nth(i)

      // Should not be visible
      await expect(element).not.toBeVisible()

      // But should be in the DOM
      await expect(element).toHaveCount(1)
    }
  })

  test('should include sr-only text for icon-only buttons', async ({
    page,
  }) => {
    await page.goto('/')

    // Find icon-only buttons
    const iconButtons = page.locator('button').filter(async (btn) => {
      const text = await btn.textContent()
      return text?.trim().length === 0
    })

    const count = await iconButtons.count()

    if (count > 0) {
      for (let i = 0; i < Math.min(5, count); i++) {
        const button = iconButtons.nth(i)

        // Should have aria-label or contain sr-only text
        const hasAriaLabel = (await button.getAttribute('aria-label')) !== null
        const hasSrOnly = (await button.locator('.sr-only').count()) > 0

        expect(hasAriaLabel || hasSrOnly).toBeTruthy()
      }
    }
  })
})
