# Analytics & Monitoring

This application includes built-in analytics and performance monitoring to help understand usage patterns and identify issues.

## Overview

The analytics system tracks:

- **Page Views**: Which pages are accessed and how often
- **Feature Usage**: Which features and charts are viewed most
- **Performance Metrics**: Core Web Vitals (LCP, FCP, CLS, FID, TTFB, INP)
- **Errors**: JavaScript errors and unhandled rejections
- **User Actions**: Clicks, form submissions, and other interactions

## Architecture

### Data Flow

```
User Action → Analytics Client → Event Queue → API Endpoint → ClickHouse
```

1. **Client-side tracking**: React hooks capture events
2. **Batching**: Events are queued and sent in batches
3. **API**: `/api/analytics` receives events and stores them
4. **Storage**: Events stored in `system.monitoring_events` table

### Event Types

All events are stored in the `system.monitoring_events` table with these kinds:

| Kind | Description | Data Format |
|------|-------------|-------------|
| `PageView` | Page navigation | JSON with url, path, title |
| `FeatureUsage` | Feature interactions | JSON with feature, action |
| `ErrorCaught` | JavaScript errors | JSON with message, stack, type |
| `PerformanceMetric` | Core Web Vitals | JSON with name, value, rating |
| `UserAction` | User interactions | JSON with action, target, context |

## Configuration

### Environment Variables

```bash
# Enable/disable analytics (default: true)
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# Anonymize IP addresses (default: false)
NEXT_PUBLIC_ANALYTICS_ANONYMIZE_IP=false

# Track performance metrics (default: true)
NEXT_PUBLIC_ANALYTICS_TRACK_PERFORMANCE=true

# Track errors (default: true)
NEXT_PUBLIC_ANALYTICS_TRACK_ERRORS=true

# Track page views (default: true)
NEXT_PUBLIC_ANALYTICS_TRACK_PAGEVIEWS=true

# Custom events table name (default: system.monitoring_events)
EVENTS_TABLE_NAME=system.monitoring_events
```

### Privacy Controls

The analytics system respects:

- **Do Not Track (DNT)**: Automatically disables tracking if DNT is enabled
- **User Consent**: Shows consent banner on first visit
- **Opt-out**: Users can disable analytics anytime
- **Local Storage**: Consent preference stored locally

## Usage

### Basic Tracking

```typescript
'use client'

import { useAnalyticsContext } from '@/components/analytics'

export function MyComponent() {
  const { trackEvent, trackFeatureUsage } = useAnalyticsContext()

  useEffect(() => {
    // Track when component is viewed
    trackFeatureUsage({
      feature: 'my-component',
      action: 'open',
    })
  }, [])

  const handleClick = () => {
    // Track custom events
    trackEvent('FeatureUsage', {
      feature: 'button-click',
      action: 'submit',
    })
  }

  return <button onClick={handleClick}>Click me</button>
}
```

### Error Tracking

Errors are automatically tracked, but you can also track manually:

```typescript
import { useAnalyticsContext } from '@/components/analytics'

export function MyComponent() {
  const { trackError } = useAnalyticsContext()

  const handleAsync = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
```

### Performance Tracking

Core Web Vitals are tracked automatically. You can also track custom metrics:

```typescript
import { useAnalyticsContext } from '@/components/analytics'

export function MyComponent() {
  const { trackPerformance } = useAnalyticsContext()

  useEffect(() => {
    const start = performance.now()
    // ... do work ...
    const duration = performance.now() - start

    trackPerformance({
      name: 'CustomOperation',
      value: duration,
      rating: duration < 100 ? 'good' : 'needs-improvement',
    })
  }, [])
}
```

## Viewing Analytics

### Page Views Dashboard

Visit `/page-views` to see:
- Daily page view trends
- Top pages by views
- Human vs bot traffic
- Device breakdown
- Geographic distribution

### Custom Queries

Query the `system.monitoring_events` table directly:

```sql
-- Feature usage over time
SELECT
    toStartOfDay(event_time) AS day,
    JSONExtractString(data, 'feature') AS feature,
    count() AS usage_count
FROM system.monitoring_events
WHERE kind = 'FeatureUsage'
    AND event_time >= now() - INTERVAL 30 DAY
GROUP BY day, feature
ORDER BY day, usage_count DESC

-- Performance metrics summary
SELECT
    JSONExtractString(data, 'name') AS metric_name,
    AVG(JSONExtractFloat(data, 'value')) AS avg_value,
    quantile(0.95)(JSONExtractFloat(data, 'value')) AS p95
FROM system.monitoring_events
WHERE kind = 'PerformanceMetric'
    AND event_time >= now() - INTERVAL 24 HOUR
GROUP BY metric_name

-- Top errors
SELECT
    JSONExtractString(data, 'type') AS error_type,
    count() AS error_count,
    any(JSONExtractString(data, 'message')) AS example_message
FROM system.monitoring_events
WHERE kind = 'ErrorCaught'
    AND event_time >= now() - INTERVAL 7 DAY
GROUP BY error_type
ORDER BY error_count DESC
LIMIT 10
```

## Schema

### system.monitoring_events Table

```sql
CREATE TABLE IF NOT EXISTS system.monitoring_events (
    kind Enum(
        'PageView',
        'FeatureUsage',
        'ErrorCaught',
        'PerformanceMetric',
        'UserAction',
        'UserKillQuery',
        'SystemKillQuery',
        'LastCleanup'
    ),
    actor LowCardinality(String) DEFAULT user(),
    data String,              -- JSON-encoded event data
    extra String,             -- Additional metadata
    event_time DateTime DEFAULT now(),
    event_date Date DEFAULT today()
) ENGINE = ReplacingMergeTree
PARTITION BY event_date
ORDER BY (kind, actor, event_time)
```

## Data Retention

Analytics data is partitioned by `event_date`. To manage retention:

```sql
-- Drop data older than 90 days
ALTER TABLE system.monitoring_events
DROP PARTITION '2024-11-01'

-- Optimize table
OPTIMIZE TABLE system.monitoring_events FINAL
```

## Privacy & Compliance

### Data Collected

- **URL paths** (not full URLs with query params)
- **Browser and OS** (user agent)
- **Device type** (desktop, mobile, tablet)
- **Geolocation** (city, country - from IP)
- **Performance metrics** (Core Web Vitals)
- **Error messages** (for debugging)

### Data NOT Collected

- Personal identifiers (names, emails)
- Full IP addresses (can be anonymized)
- Sensitive data (passwords, tokens)
- Query content (SQL queries are NOT logged)

### Compliance

This analytics system:
- Stores data in your ClickHouse instance only
- Does not share data with third parties
- Respects DNT header
- Requires user consent
- Allows complete opt-out

## Troubleshooting

### Events Not Appearing

1. Check analytics is enabled:
   ```bash
   # In browser console
   localStorage.getItem('analytics-consent')
   ```

2. Verify ClickHouse table exists:
   ```sql
   SELECT * FROM system.monitoring_events LIMIT 1
   ```

3. Check network requests:
   ```bash
   # Look for POST requests to /api/analytics
   ```

### High Memory Usage

If the event queue grows too large:
- Reduce `batchSize` in `lib/analytics/config.ts`
- Reduce `flushInterval` to send events more frequently
- Disable performance tracking if not needed

### Performance Impact

Analytics is designed to have minimal impact:
- Events are batched and sent asynchronously
- `sendBeacon` used during page unload
- No blocking operations on the main thread
- Failed events are queued and retried

## Advanced

### Custom Event Types

To add a new event kind:

1. Update the Enum in `lib/tracking.ts`:
   ```sql
   kind Enum('PageView', 'FeatureUsage', 'MyNewKind', ...)
   ```

2. Add type definitions in `lib/analytics/types.ts`:
   ```typescript
   export type AnalyticsEventKind =
     | 'PageView'
     | 'MyNewKind'
     | ...
   ```

3. Create tracking hook in `lib/analytics/hooks.tsx`:
   ```typescript
   export function useMyFeatureTracking() {
     const analytics = useAnalytics()
     useEffect(() => {
       analytics.trackEvent('MyNewKind', { data: 'value' })
     }, [])
   }
   ```

### Custom Destination

To send events elsewhere (e.g., external service):

Modify `lib/analytics/client.ts`:

```typescript
async flush(sync = false) {
  // ... existing code ...

  // Also send to external service
  await fetch('https://analytics.example.com/track', {
    method: 'POST',
    body: JSON.stringify({ events: eventsToSend }),
  })
}
```
