# Icon System Documentation

## Overview

This project uses two complementary icon libraries for different purposes:

- **@radix-ui/react-icons**: Lightweight icons designed for Radix UI components
- **lucide-react**: Comprehensive icon set for navigation and general UI

Both libraries are tree-shakeable, ensuring only used icons are included in the bundle.

## When to Use Each Library

### @radix-ui/react-icons

Use for **Radix UI component integration**:
- DropdownMenu icons
- Dialog icons
- Accordion icons
- Any shadcn/ui component that needs icons

**Default size**: 15x15px (designed for component-scale use)

```tsx
import { ChevronDownIcon } from '@radix-ui/react-icons'

<ChevronDownIcon className="h-4 w-4" />
```

### lucide-react

Use for **navigation and general UI**:
- Navigation menu items (see `menu.ts`)
- Feature cards and sections
- Action buttons
- Status indicators

**Default size**: 24x24px (better for touch targets and visibility)

```tsx
import { Home, Settings, Database } from 'lucide-react'

<Home className="h-5 w-5" />
```

## Icon Sizes by Context

| Context | Size | Class |
|---------|------|-------|
| Navigation (desktop) | 16px | `h-4 w-4` |
| Navigation (mobile) | 20px | `h-5 w-5` |
| Feature cards | 20px | `h-5 w-5` |
| Buttons | 16px | `h-4 w-4` |
| Small indicators | 12px | `h-3 w-3` |
| Large headers | 24px | `h-6 w-6` |

## Menu Icon Mapping

Navigation icons are defined in `menu.ts`:

```tsx
{
  title: 'Overview',
  href: '/overview',
  icon: HomeIcon,  // from @radix-ui/react-icons
  section: 'main',
}
```

**Pattern**: Use lucide-react for new main navigation items for better visual consistency.

## Accessibility

All icons must include:
- `aria-label` when used without text
- Meaningful titles in SVG components
- Proper focus indicators for interactive icons

```tsx
// Good: Icon with accessible label
<button aria-label="Refresh data">
  <RefreshCw className="h-4 w-4" />
</button>

// Good: SVG with title
<svg role="img">
  <title>ClickHouse</title>
  <path d="..." />
</svg>
```

## Custom Icons

### ClickHouse Logo

Located at `/components/icons/clickhouse-logo.tsx` - inline SVG for optimal performance:

```tsx
import { ClickHouseLogo } from '@/components/icons/clickhouse-logo'

<ClickHouseLogo
  width={24}
  height={24}
  className="h-6 w-6 text-foreground"
/>
```

**Benefits**:
- No HTTP request
- Instant rendering
- CSS color control via `currentColor`
- Properly sized at any dimension

## Adding New Icons

1. **Check if icon exists** in either library first
2. **Prefer lucide-react** for navigation and general UI
3. **Use @radix-ui/react-icons** for component integration
4. **Create custom SVG** only when necessary (like logos)

### Finding Icons

- Lucide: https://lucide.dev/icons/
- Radix: https://www.radix-ui.com/icons

## Performance Notes

- Both libraries are tree-shakeable
- Unused icons are excluded from production builds
- Inline SVG (like ClickHouseLogo) has zero runtime cost
- Avoid converting library icons to inline SVG - use the component API

## Common Icon Patterns

### Navigation with Active State

```tsx
<Link href="/overview" className={cn(
  "flex items-center gap-2",
  isActive && "text-foreground"
)}>
  <Home className="h-4 w-4" />
  <span>Overview</span>
</Link>
```

### Button with Icon

```tsx
<Button>
  <Download className="mr-2 h-4 w-4" />
  Export
</Button>
```

### Icon Badge

```tsx
<Badge variant="secondary">
  <AlertTriangle className="mr-1 h-3 w-3" />
  Warning
</Badge>
```

## Migration Notes

When updating icons:
- Search for the icon usage across the codebase
- Update all instances for consistency
- Test responsive behavior (icons shouldn't break on mobile)
- Verify accessibility with keyboard navigation
