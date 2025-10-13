# Error Handling Documentation

This document describes the enhanced error handling system implemented in the ClickHouse Monitoring application.

## Overview

The application now features environment-aware error handling that provides:

- **Development mode**: Detailed error information including stack traces for debugging
- **Production mode**: User-friendly messages with error tracking IDs, without exposing sensitive details

## Architecture

### Core Components

#### 1. Environment Detection (`lib/env-utils.ts`)

Utilities for detecting the current runtime environment:

- `isDevelopment()` - Returns true in development
- `isProduction()` - Returns true in production
- `shouldShowDetailedErrors()` - Determines if detailed errors should be shown

#### 2. Error Logging (`lib/error-logger.ts`)

Structured error logging with environment awareness:

- `ErrorLogger.logError()` - Logs errors with full details in dev, sanitized in prod
- `ErrorLogger.logWarning()` - Logs warnings
- `ErrorLogger.logDebug()` - Logs debug info (dev only)
- `formatErrorForDisplay()` - Formats errors for UI display based on environment

#### 3. Error Alert Component (`components/error-alert.tsx`)

Reusable error display component with support for:

- Custom titles and messages
- Error digest display for tracking
- Stack traces (development only)
- Query details
- Documentation links
- Different variants (destructive, warning, info)

#### 4. Error Boundaries

- `app/error.tsx` - Route-level error boundary
- `app/global-error.tsx` - Global application error boundary

## Features

### Development Mode Features

1. **Detailed Error Messages**: Shows actual error names and messages
2. **Stack Traces**: Full stack traces in collapsible accordions
3. **Error Context**: Component name, digest, and other metadata
4. **Console Logging**: Comprehensive structured logging with all details

### Production Mode Features

1. **Generic Error Messages**: User-friendly messages without technical details
2. **Error Digest**: Unique error ID for support team tracking
3. **Sanitized Logging**: Only essential information logged (no stack traces)
4. **Security**: No sensitive information exposed to users

## Usage Examples

### Using ErrorAlert Component

```tsx
import { ErrorAlert } from '@/components/error-alert'

// Basic usage
<ErrorAlert
  title="Error occurred"
  message="Something went wrong"
/>

// With digest for tracking
<ErrorAlert
  title="Error occurred"
  message="Something went wrong"
  digest="abc123xyz"
/>

// With stack trace (shown only in dev)
<ErrorAlert
  title="Error occurred"
  message="An error happened"
  stack={error.stack}
  digest={error.digest}
/>

// With query details
<ErrorAlert
  title="Query failed"
  message="The database query failed"
  query="SELECT * FROM users"
  docs="Check the documentation for query syntax"
/>
```

### Using ErrorLogger

```typescript
import { ErrorLogger } from '@/lib/error-logger'

try {
  // ... your code
} catch (error) {
  ErrorLogger.logError(error as Error, {
    digest: 'error-123',
    component: 'MyComponent',
    action: 'fetchData',
  })
}

// Warning logging
ErrorLogger.logWarning('This might be an issue', {
  component: 'MyComponent',
})

// Debug logging (dev only)
ErrorLogger.logDebug('Debug info', { data: someData })
```

### Custom Error Boundaries

```tsx
'use client'

import { ErrorLogger, formatErrorForDisplay } from '@/lib/error-logger'
import { ErrorAlert } from '@/components/error-alert'

export default function CustomError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    ErrorLogger.logError(error, {
      digest: error.digest,
      component: 'CustomErrorBoundary',
    })
  }, [error])

  const formattedError = formatErrorForDisplay(error)

  return (
    <ErrorAlert
      title={formattedError.title}
      message={formattedError.message}
      digest={formattedError.details?.digest}
      stack={formattedError.details?.stack}
      reset={reset}
    />
  )
}
```

## Error Digest

The error digest is a unique identifier provided by Next.js for each error occurrence. It's useful for:

- Tracking specific error instances in production
- Correlating user reports with server logs
- Debugging production issues without exposing sensitive details

In production, users see:

```
Error ID (for support): abc123xyz
```

Support teams can use this digest to find detailed logs server-side.

## Testing

### Unit Tests

- `lib/__tests__/env-utils.test.ts` - Environment detection tests
- `lib/__tests__/error-logger.test.ts` - Error logging tests

### Component Tests

- `app/error.cy.tsx` - Error boundary component tests
- `components/error-alert.cy.tsx` - ErrorAlert component tests

Run tests:

```bash
# All component tests
pnpm component:headless

# Specific test file
pnpm component:headless --spec "app/error.cy.tsx"
```

## Environment Variables

The error handling system automatically detects the environment using `NODE_ENV`:

- `development` - Shows detailed errors
- `production` - Shows generic errors with digest
- `test` - Test environment behavior

No additional configuration needed.

## Best Practices

1. **Always log errors**: Use `ErrorLogger.logError()` for consistent logging
2. **Include context**: Provide component name, action, and other relevant metadata
3. **Use digest**: Always pass the error digest when available
4. **Don't expose sensitive data**: Never include passwords, tokens, or PII in error messages
5. **Test both modes**: Verify error handling works in both dev and prod builds
6. **User-friendly messages**: Production messages should be clear and actionable
7. **Provide error IDs**: Always show the digest in production for support tracking

## Migration Guide

If you have existing error handling code:

### Before:

```tsx
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorAlert
      title="Something went wrong"
      message={error.message}
      reset={reset}
    />
  )
}
```

### After:

```tsx
import { ErrorLogger, formatErrorForDisplay } from '@/lib/error-logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    ErrorLogger.logError(error, {
      digest: error.digest,
      component: 'ErrorBoundary',
    })
  }, [error])

  const formattedError = formatErrorForDisplay(error)

  return (
    <ErrorAlert
      title={formattedError.title}
      message={formattedError.message}
      digest={formattedError.details?.digest}
      stack={formattedError.details?.stack}
      reset={reset}
    />
  )
}
```

## Troubleshooting

### Stack traces not showing in development

- Verify `NODE_ENV=development` is set
- Check browser console for any errors
- Ensure `shouldShowDetailedErrors()` returns true

### Error digest not showing

- Verify the error has a `digest` property
- Check that the `digest` prop is passed to ErrorAlert
- Ensure Next.js error boundary is providing the digest

### Production build shows too much detail

- Verify `NODE_ENV=production` in production build
- Check that `process.env.NODE_ENV` is correctly set
- Rebuild the application with production settings

## Future Enhancements

Potential improvements to consider:

- Error reporting service integration (Sentry, Rollbar, etc.)
- Error analytics and tracking dashboard
- User feedback form on error pages
- Automatic error recovery strategies
- Error categorization and custom handling per type
