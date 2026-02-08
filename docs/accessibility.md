# Accessibility Guide

This guide outlines the accessibility features and best practices implemented in the ClickHouse Monitoring Dashboard.

## Overview

The dashboard follows WCAG 2.1 Level AA guidelines to ensure compatibility with assistive technologies like screen readers, keyboard navigation, and other accessibility tools.

## Features

### Skip to Main Content

A "Skip to main content" link appears as the first focusable element when using keyboard navigation. This allows users to bypass navigation menus and jump directly to the main content area.

**How to use:**
1. Navigate to the dashboard
2. Press `Tab` once - the skip link appears at the top-left
3. Press `Enter` to jump to main content

**Implementation:** `/components/accessibility/skip-link.tsx`

### Keyboard Navigation

All interactive elements are keyboard accessible:

| Action | Keyboard Shortcut |
|--------|-------------------|
| Navigate forward | `Tab` |
| Navigate backward | `Shift + Tab` |
| Activate button/link | `Enter` or `Space` |
| Toggle sidebar | `Cmd/Ctrl + B` |
| Close dialog | `Escape` |
| Open command palette | `Cmd/Ctrl + K` |

### Focus Indicators

All interactive elements have visible focus indicators (rings/outline) when navigating with keyboard. The focus indicator uses the `--ring` CSS variable for consistent theming.

### Screen Reader Support

#### Live Regions

Dynamic content updates are announced to screen readers using ARIA live regions:

- **Polite updates**: Non-critical information (chart refresh, data updates)
- **Assertive updates**: Important messages (errors, alerts)

**Implementation:** `/components/accessibility/live-region.tsx`

#### Semantic Structure

- Proper heading hierarchy (`h1` → `h2` → `h3`)
- Landmark roles (`main`, `nav`, `header`, `section`)
- ARIA labels on icon-only buttons
- Descriptive link text (avoiding "click here")

#### Charts Accessibility

Charts include accessible alternatives:
- Text summaries of chart content
- Optional data table view
- ARIA descriptions where appropriate

**Implementation:** `/components/accessibility/chart-data-table.tsx`

### Color and Contrast

All text and interactive elements meet WCAG AA contrast requirements:
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- Interactive elements: 3:1 minimum

### Responsive Design

The dashboard is fully responsive and works with:
- Screen magnification (up to 200%)
- Browser zoom (up to 400%)
- Text spacing adjustments
- High contrast mode (browser preference)

## Component Patterns

### Accessible Button

```tsx
import { Button } from '@/components/ui/button'

// Icon button with aria-label
<Button
  aria-label="Refresh data"
  onClick={handleRefresh}
>
  <RefreshIcon />
</Button>

// Text button
<Button onClick={handleAction}>
  Save Changes
</Button>
```

### Accessible Icon Button

```tsx
import { IconButton } from '@/components/ui/icon-button'

<IconButton
  tooltip="Switch to dark mode"
  icon={<MoonIcon />}
  onClick={toggleTheme}
/>
```

### Accessible Form Input

```tsx
<Label htmlFor="email">Email address</Label>
<Input
  id="email"
  type="email"
  aria-describedby="email-hint"
  aria-invalid={hasError}
  aria-required="true"
/>
<p id="email-hint" className="text-sm text-muted-foreground">
  We'll never share your email
</p>
{hasError && (
  <p id="email-error" role="alert" className="text-sm text-destructive">
    {errorMessage}
  </p>
)}
```

### Accessible Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Settings</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
      <DialogDescription>
        Configure your dashboard preferences
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### Accessible Chart with Data Table

```tsx
import { AreaChart } from '@/components/charts/primitives/area'
import { ChartDataTable, VisuallyHidden } from '@/components/accessibility'

function MyChart({ data }: ChartProps) {
  return (
    <div>
      <VisuallyHidden>
        <h2>Query Performance Over Time</h2>
        <p>
          Area chart showing query count over the last 24 hours.
          Peak at 2pm with 150 queries.
        </p>
      </VisuallyHidden>

      <AreaChart data={data} index="time" categories={['count']} />

      <details className="mt-4">
        <summary className="cursor-pointer text-sm">
          View data as table
        </summary>
        <ChartDataTable
          data={data}
          columns={[
            { key: 'time', label: 'Time' },
            { key: 'count', label: 'Query Count', format: String },
          ]}
        />
      </details>
    </div>
  )
}
```

### Live Region Announcements

```tsx
import { useAnnouncement } from '@/components/accessibility'

function ChartComponent() {
  const { announce, Announcement } = useAnnouncement()

  const handleRefresh = () => {
    refreshData()
    announce('Chart data refreshed successfully')
  }

  return (
    <>
      <button onClick={handleRefresh}>Refresh</button>
      <Announcement />
    </>
  )
}
```

## Testing

### Manual Testing Checklist

- [ ] All functionality available via keyboard
- [ ] Focus indicators visible on all interactive elements
- [ ] Tab order follows logical flow
- [ ] Skip link works and jumps to main content
- [ ] Dialogs trap focus and close with Escape
- [ ] Forms show errors inline and announce to screen readers
- [ ] Charts have text alternatives
- [ ] Color contrast meets WCAG AA standards
- [ ] Text resizing works up to 200%
- [ ] Screen reader announces page changes and dynamic content

### Automated Tests

Run accessibility tests with Playwright:

```bash
bun run test:a11y
```

Test file: `/tests/accessibility/a11y.spec.ts`

### Screen Reader Testing

Test with popular screen readers:

**macOS: VoiceOver**
- Enable: `Cmd + F5` or Settings → Accessibility → VoiceOver
- Navigation: `Ctrl + Option + Arrow keys`
- Read item: `Ctrl + Option + Shift + Down`

**Windows: NVDA**
- Download: https://www.nvaccess.org/
- Navigation: `Arrow keys` / `Tab`
- Read all: `NVDA + Down arrow`

**Windows: Narrator**
- Enable: `Win + Ctrl + Enter`
- Navigation: `Caps Lock + Arrow keys`

## Browser Tools

### Accessibility Inspectors

- **Chrome DevTools**: Elements panel → Accessibility pane
- **Firefox Developer Tools**: Accessibility Inspector
- **axe DevTools**: Browser extension for comprehensive testing

### Color Contrast Checkers

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Chrome Lighthouse**: Built-in accessibility audit
- **axe DevTools**: Includes color contrast analysis

## WCAG 2.1 Compliance

| Level | Status |
|-------|--------|
| A | ✅ Complete |
| AA | ✅ Complete |
| AAA | ⚠️ Partial (high contrast mode) |

### Covered Success Criteria

- **1.1.1 Non-text Content**: Charts have text alternatives
- **1.3.1 Info and Relationships**: Proper heading hierarchy
- **1.3.2 Meaningful Sequence**: Logical tab order
- **1.3.4 Orientation**: Content works in portrait and landscape
- **1.4.3 Contrast (Minimum)**: 4.5:1 for normal text
- **1.4.4 Resize text**: Works up to 200%
- **1.4.10 Reflow**: Content fits 320px viewport
- **2.1.1 Keyboard**: All functions keyboard accessible
- **2.1.2 No Keyboard Trap**: Focus can move away from all components
- **2.4.1 Bypass Blocks**: Skip link implemented
- **2.4.3 Focus Order**: Logical tab order
- **2.5.5 Target Size**: Touch targets ≥44×44px
- **3.2.1 On Focus**: No context change on focus
- **3.3.2 Labels or Instructions**: Form inputs have labels
- **4.1.2 Name, Role, Value**: All interactive elements have proper ARIA

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility Checklist](https://webaim.org/standards/wcag/checklist)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [Next.js Accessibility](https://nextjs.org/docs/app/building-your-application/optimizing/accessibility)

## Contributing

When adding new features:

1. **Test with keyboard** - Ensure all actions work with Tab/Enter/Escape
2. **Add ARIA labels** - Icon buttons need descriptive labels
3. **Use semantic HTML** - Proper headings, landmarks, lists
4. **Check color contrast** - Use tools to verify 4.5:1 minimum
5. **Test with screen reader** - Verify announcements are clear
6. **Include in tests** - Add accessibility tests in `/tests/accessibility/`
