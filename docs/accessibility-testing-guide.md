# Accessibility Testing Guide

This guide provides comprehensive instructions for testing accessibility features in the ClickHouse Monitoring Dashboard.

## Quick Accessibility Checklist

Use this checklist for quick verification during development:

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab for backward navigation
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys navigate within components (menus, grids)
- [ ] Home/End jump to first/last items
- [ ] Focus indicators are clearly visible

### Screen Reader
- [ ] Skip link appears on first Tab
- [ ] Page title is descriptive
- [ ] Headings form logical hierarchy (h1 → h2 → h3)
- [ ] Landmarks are present (banner, main, nav, contentinfo)
- [ ] Images have alt text or are decorative
- [ ] Form inputs have associated labels
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced

### Visual
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Text can be resized to 200% without horizontal scroll
- [ ] Content is readable at 320px viewport width
- [ ] Focus indicators are clearly visible
- [ ] No color-only indicators
- [ ] Links are distinguishable from text

### Forms
- [ ] All inputs have labels
- [ ] Required fields are indicated
- [ ] Error messages are clear and specific
- [ ] Validation happens on submit or with clear feedback
- [ ] Success/error states are announced

## Testing Tools

### Automated Testing

#### Lighthouse (Chrome DevTools)
```bash
# Run Lighthouse audit
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Accessibility" checkbox
4. Click "Analyze page load"
5. Review accessibility score (aim for 95+)
```

#### axe DevTools Extension
```bash
# Install axe DevTools
1. Install from: https://www.deque.com/axe/
2. Open DevTools (F12)
3. Go to axe DevTools tab
4. Click "Scan ALL of my page"
5. Review violations and fix
```

#### Playwright Accessibility Tests
```bash
# Run accessibility test suite
bun run test:a11y

# Run specific test file
bunx playwright test tests/accessibility/a11y.spec.ts
```

### Manual Testing

#### Keyboard Navigation Test
1. Unplug mouse / use keyboard only
2. Press Tab to navigate through page
3. Verify you can:
   - Access all interactive elements
   - Complete all tasks
   - Exit any modal/dropdown
   - Navigate data tables
   - Use chart controls

#### Screen Reader Testing

**macOS - VoiceOver**
```
Enable: Cmd + F5
Navigation:
- Ctrl + Option + Arrow: Navigate
- Ctrl + Option + Shift + Down: Enter element
- Ctrl + Option + Shift + Up: Exit element
- VO + U: Rotor (list of elements)
- VO + ;: Accessibility rotor
```

**Windows - NVDA**
```
Download: https://www.nvaccess.org/
Navigation:
- Arrow keys: Navigate
- Enter: Activate
- Tab: Next focusable
- Shift+Tab: Previous focusable
- NVDA + F7: Element list
- NVDA + Down: Read all
```

**Windows - Narrator**
```
Enable: Win + Ctrl + Enter
Navigation:
- CapsLock + Arrow: Navigate
- CapsLock + Enter: Activate
- CapsLock + Space: Read item
- CapsLock + Left/Right: Move by word
```

## Component-Specific Testing

### Charts
```bash
Test items:
1. Chart has aria-label or title
2. Data can be accessed via keyboard
3. Tooltip is keyboard accessible
4. Chart has text alternative
5. Empty state has accessible message

Test procedure:
1. Tab to chart controls
2. Use arrow keys to explore data
3. Verify tooltip shows on focus
4. Check for sr-only description
```

### Data Tables
```bash
Test items:
1. Table has caption or aria-label
2. Headers are properly marked (scope="col")
3. Sort indicators are announced
4. Pagination is keyboard accessible
5. Row actions are accessible

Test procedure:
1. Tab to table
2. Navigate headers with arrow keys
3. Press Enter/Space to sort
4. Navigate rows with arrow keys
5. Activate row actions
```

### Forms
```bash
Test items:
1. Labels are connected to inputs (htmlFor/id)
2. Required fields are marked
3. Error messages are in DOM and announced
4. Validation provides clear feedback
5. Submit button shows loading state

Test procedure:
1. Tab through form fields
2. Check labels are announced
3. Submit form with errors
4. Verify errors are announced
5. Fix errors and submit again
```

### Modals/Dialogs
```bash
Test items:
1. Focus trap works
2. Initial focus is set appropriately
3. Escape key closes dialog
4. Focus returns to trigger
5. Background content is hidden

Test procedure:
1. Open dialog
2. Check focus is inside
3. Try to Tab outside (shouldn't work)
4. Press Escape to close
5. Verify focus returns to trigger
```

## WCAG 2.1 Compliance Testing

### Level A (Must Have)
- [ ] Non-text content has alternatives
- [ ] Video has captions/transcript
- [ ] Content can be presented in different ways
- [ ] Content is readable without color
- ] Audio can be paused/stopped
- [ ] Keyboard accessible
- [ ] No keyboard traps
- [ ] Skip navigation link
- ] Page titles are descriptive
- ] Focus order is logical
- ] Link purpose is clear from text
- ] Multiple ways to navigate
- ] Headings and labels are descriptive
- ] Focus is visible

### Level AA (Should Have)
- [ ] Text contrast ≥ 4.5:1
- [ ] Large text contrast ≥ 3:1
- [ ] Text can be resized to 200%
- [ ] Images don't flash >3 times/second
- ] Page is readable at 320px width
- ] Keyboard shortcuts can be disabled
- ] Pointer gestures not required
- ] Target size ≥44×44px (touch)
- ] Icon buttons have labels
- ] Errors are clearly identified
- ] Labels or instructions provided
- ] Error suggestions provided
- ] Status messages announced

### Level AAA (Nice to Have)
- [ ] Text contrast ≥ 7:1
- [ ] Large text contrast ≥ 4.5:1
- [ ] Audio description for video
- ] Live captions for audio
- ] No background audio
- ] Text spacing adjustable
- ] High contrast mode support
- ] Low contrast mode support

## Browser Extensions for Testing

### Essential Extensions
1. **axe DevTools** - Automated accessibility testing
2. **WAVE** - Visual accessibility evaluation
3. **Lighthouse** - Performance and accessibility audit
4. **Color Contrast Analyzer** - Check color ratios
5. **Focus Indicator** - Visualize focus flow

### Installation
```
Chrome:
- axe DevTools: https://chrome.google.com/webstore
- WAVE: https://chrome.google.com/webstore
- Lighthouse: Built into Chrome DevTools

Firefox:
- axe DevTools: https://addons.mozilla.org
- Accessibar: https://addons.mozilla.org
```

## Continuous Integration

### Automated Testing in CI
```yaml
# .github/workflows/accessibility.yml
name: Accessibility

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: bun run test:a11y
      - run: bunx playwright test --reporter=json
```

### Accessibility Score Thresholds
```javascript
// lighthous.config.js
module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['accessibility'],
    passed: true,
    assertions: {
      'accessibility-score': ['error', { minScore: 0.95 }],
      'aria-labels': 'error',
      'aria-allowed-attr': 'error',
      'heading-order': 'warn',
    },
  },
}
```

## Common Issues and Fixes

### Missing Alt Text
```
Issue: Image has no alt attribute
Fix: <img src="logo.png" alt="Company Logo" />
```

### Invalid Heading Hierarchy
```
Issue: Heading levels skip (h1 → h3)
Fix: Use h1, h2, h3 in sequence
```

### Low Color Contrast
```
Issue: Text doesn't meet 4.5:1 contrast ratio
Fix: Use lighter text or darker background
Check: https://webaim.org/resources/contrastchecker/
```

### Missing Form Labels
```
Issue: Input has no associated label
Fix: <label htmlFor="email">Email</label>
     <input id="email" type="email" />
```

### Focus Not Visible
```
Issue: No visible focus indicator
Fix: Add focus-visible styles
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### ARIA Hidden on Focusable Element
```
Issue: aria-hidden on interactive element
Fix: Remove aria-hidden or make element non-interactive
```

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility Checklist](https://webaim.org/standards/wcag/checklist)
- [Inclusive Components](https://inclusive-components.design/)
- [a11y Project Checklist](https://www.a11yproject.com/checklist/)
