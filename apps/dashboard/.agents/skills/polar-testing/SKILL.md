---
name: polar-testing
description: |
  Guide for testing Polar payment integrations using the sandbox environment. Use this skill when: (1) Setting up the Polar sandbox for development; (2) Testing checkout flows without real payments; (3) Using Stripe test cards with Polar; (4) Writing integration tests for payment flows; (5) Testing webhooks locally with ngrok; (6) Mocking Polar in unit tests; (7) Setting up CI/CD pipelines with Polar sandbox; (8) Debugging payment issues in sandbox.
---

# Polar Testing Guide

Test Polar integrations safely using the sandbox environment - a fully isolated server where you can experiment without affecting production data or processing real payments.

## Sandbox Environment

### Access

- **Dashboard**: https://sandbox.polar.sh
- **API**: https://sandbox-api.polar.sh/v1

The sandbox is completely isolated from production. You need separate:
- User account
- Organization
- Access tokens
- Webhook endpoints

### Setup Steps

1. Go to https://sandbox.polar.sh/start
2. Create a new account (or use "Go to sandbox" from org switcher)
3. Create a test organization
4. Generate an access token in Settings → Developers

### SDK Configuration

```typescript
// TypeScript
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox", // Switch to "production" for live
});
```

```python
# Python
from polar_sdk import Polar

polar = Polar(
    access_token=os.environ["POLAR_ACCESS_TOKEN"],
    server="sandbox",
)
```

```go
// Go
s := polargo.New(
    polargo.WithServer("sandbox"),
    polargo.WithSecurity(os.Getenv("POLAR_ACCESS_TOKEN")),
)
```

### Sandbox Limitations

- Subscriptions auto-cancel after 90 days
- No real money is processed
- Data is isolated from production

## Test Cards

Polar uses Stripe for payment processing. Use these test card numbers:

### Successful Payments

| Card Number | Brand | CVC | Expiry |
|-------------|-------|-----|--------|
| 4242 4242 4242 4242 | Visa | Any 3 digits | Any future date |
| 5555 5555 5555 4444 | Mastercard | Any 3 digits | Any future date |
| 3782 822463 10005 | Amex | Any 4 digits | Any future date |
| 6011 1111 1111 1117 | Discover | Any 3 digits | Any future date |

### Declined Payments

| Card Number | Decline Reason |
|-------------|----------------|
| 4000 0000 0000 0002 | Generic decline |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 9987 | Lost card |
| 4000 0000 0000 9979 | Stolen card |
| 4000 0000 0000 0069 | Expired card |
| 4000 0000 0000 0127 | Incorrect CVC |

### 3D Secure Testing

| Card Number | Behavior |
|-------------|----------|
| 4000 0027 6000 3184 | Requires 3DS authentication |
| 4000 0000 0000 3220 | Requires 3DS authentication |

## Local Webhook Testing

### Using ngrok

```bash
# Start your app
npm run dev

# In another terminal, start ngrok
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and configure it in Polar:

1. Go to sandbox.polar.sh → Settings → Webhooks
2. Add endpoint: `https://abc123.ngrok.io/api/webhooks/polar`
3. Select events to receive
4. Copy the webhook secret

### Environment Variables

```bash
# .env.local
POLAR_ACCESS_TOKEN=pat_sandbox_xxx
POLAR_WEBHOOK_SECRET=whsec_sandbox_xxx
POLAR_SERVER=sandbox
```

## Integration Testing

### Test Checkout Flow

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { Polar } from "@polar-sh/sdk";

describe("Polar Checkout", () => {
  const polar = new Polar({
    accessToken: process.env.POLAR_SANDBOX_TOKEN!,
    server: "sandbox",
  });

  let testProductId: string;

  beforeAll(async () => {
    // Create test product
    const product = await polar.products.create({
      name: "Test Product",
      organizationId: process.env.POLAR_ORG_ID!,
      prices: [{
        type: "one_time",
        amountType: "fixed",
        priceAmount: 1000,
        priceCurrency: "usd",
      }],
    });
    testProductId = product.id;
  });

  it("should create checkout session", async () => {
    const checkout = await polar.checkouts.create({
      products: [testProductId],
      successUrl: "http://localhost:3000/success",
      customerEmail: "test@example.com",
    });

    expect(checkout.status).toBe("open");
    expect(checkout.url).toBeDefined();
    expect(checkout.url).toContain("sandbox");
  });

  it("should retrieve checkout", async () => {
    const checkout = await polar.checkouts.create({
      products: [testProductId],
      successUrl: "http://localhost:3000/success",
    });

    const retrieved = await polar.checkouts.get({ id: checkout.id });
    expect(retrieved.id).toBe(checkout.id);
  });
});
```

### Test Webhook Handler

```typescript
import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";

describe("Webhook Handler", () => {
  const webhookSecret = "whsec_test_secret";

  function signPayload(payload: string, timestamp: number): string {
    const signedPayload = `${timestamp}.${payload}`;
    return createHmac("sha256", webhookSecret)
      .update(signedPayload)
      .digest("hex");
  }

  it("should verify valid webhook signature", async () => {
    const payload = JSON.stringify({
      type: "order.paid",
      data: { id: "order_123" },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signPayload(payload, timestamp);

    const response = await fetch("/api/webhooks/polar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "webhook-id": "evt_123",
        "webhook-timestamp": timestamp.toString(),
        "webhook-signature": `v1,${signature}`,
      },
      body: payload,
    });

    expect(response.status).toBe(200);
  });

  it("should reject invalid signature", async () => {
    const response = await fetch("/api/webhooks/polar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "webhook-id": "evt_123",
        "webhook-timestamp": "1234567890",
        "webhook-signature": "v1,invalid",
      },
      body: JSON.stringify({ type: "order.paid" }),
    });

    expect(response.status).toBe(400);
  });
});
```

### Test License Key Validation

```typescript
describe("License Keys", () => {
  it("should validate license key", async () => {
    // First create a customer with a license key benefit
    // Then validate the key
    const result = await polar.licenseKeys.validate({
      key: "TEST-XXXX-XXXX-XXXX",
      organizationId: process.env.POLAR_ORG_ID!,
    });

    expect(result.valid).toBe(true);
    expect(result.customer).toBeDefined();
  });

  it("should reject invalid license key", async () => {
    const result = await polar.licenseKeys.validate({
      key: "INVALID-KEY",
      organizationId: process.env.POLAR_ORG_ID!,
    });

    expect(result.valid).toBe(false);
  });
});
```

## Mocking Polar in Unit Tests

### Mock SDK

```typescript
import { vi } from "vitest";

// Mock the entire SDK
vi.mock("@polar-sh/sdk", () => ({
  Polar: vi.fn().mockImplementation(() => ({
    checkouts: {
      create: vi.fn().mockResolvedValue({
        id: "checkout_mock",
        url: "https://sandbox.polar.sh/checkout/mock",
        status: "open",
      }),
      get: vi.fn().mockResolvedValue({
        id: "checkout_mock",
        status: "succeeded",
      }),
    },
    customers: {
      getState: vi.fn().mockResolvedValue({
        activeSubscriptions: [
          { id: "sub_mock", status: "active", productId: "prod_mock" },
        ],
        grantedBenefits: [],
      }),
    },
    subscriptions: {
      list: vi.fn().mockResolvedValue([]),
      cancel: vi.fn().mockResolvedValue({}),
    },
  })),
}));
```

### Mock Webhook Payloads

```typescript
export const mockWebhookPayloads = {
  orderPaid: {
    type: "order.paid",
    data: {
      id: "order_123",
      status: "paid",
      customer_id: "cust_123",
      product_id: "prod_123",
      total_amount: 2900,
      currency: "usd",
    },
  },
  subscriptionCreated: {
    type: "subscription.created",
    data: {
      id: "sub_123",
      status: "active",
      customer_id: "cust_123",
      product_id: "prod_123",
      current_period_end: "2025-02-15T00:00:00Z",
    },
  },
  subscriptionCanceled: {
    type: "subscription.canceled",
    data: {
      id: "sub_123",
      status: "active",
      cancel_at_period_end: true,
      ends_at: "2025-02-15T00:00:00Z",
    },
  },
  benefitGrantCreated: {
    type: "benefit_grant.created",
    data: {
      id: "grant_123",
      customer_id: "cust_123",
      benefit_id: "benefit_123",
      is_granted: true,
      properties: {
        license_key: "TEST-XXXX-XXXX-XXXX",
      },
    },
  },
};
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Test Polar Integration

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    env:
      POLAR_ACCESS_TOKEN: ${{ secrets.POLAR_SANDBOX_TOKEN }}
      POLAR_WEBHOOK_SECRET: ${{ secrets.POLAR_SANDBOX_WEBHOOK_SECRET }}
      POLAR_ORG_ID: ${{ secrets.POLAR_SANDBOX_ORG_ID }}
      POLAR_SERVER: sandbox

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
```

### Environment Setup

Create sandbox credentials specifically for CI:

1. Create a dedicated sandbox organization for CI
2. Generate a CI-specific access token
3. Set up webhook endpoint (or skip webhook tests in CI)
4. Store credentials in GitHub Secrets

## Debugging Tips

### Check Webhook Delivery

1. Go to sandbox.polar.sh → Settings → Webhooks
2. Click on your endpoint
3. View delivery history and payloads
4. Check response codes and errors

### Common Issues

**Webhook signature mismatch**
- Ensure you're using the sandbox webhook secret
- Check that the raw body is being passed (not parsed JSON)
- Verify timestamp is within tolerance (5 minutes)

**Checkout not completing**
- Use test cards, not real cards
- Check browser console for errors
- Verify successUrl is correct

**API returns 401**
- Verify you're using sandbox token with sandbox API
- Check token hasn't expired
- Ensure token has required scopes

### Enable Debug Logging

```typescript
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
  // Enable debug mode if available
});

// Log all requests
polar.checkouts.create({...}).then(console.log).catch(console.error);
```

## Test Checklist

Before going to production:

- [ ] Checkout flow completes successfully
- [ ] Webhooks received and processed
- [ ] Subscription lifecycle works (create, cancel, revoke)
- [ ] Benefits granted and revoked correctly
- [ ] License key validation works
- [ ] Error handling for declined payments
- [ ] Customer portal accessible
- [ ] Refund flow tested
