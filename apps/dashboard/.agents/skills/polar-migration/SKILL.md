---
name: polar-migration
description: |
  Guide for migrating to Polar from other payment platforms (Stripe Billing, Paddle, Lemon Squeezy, Gumroad). Use this skill when: (1) Planning a migration from another payment provider to Polar; (2) Migrating customer data and subscriptions; (3) Running parallel systems during transition; (4) Mapping products and pricing between platforms; (5) Handling payment method migration; (6) Communicating migration to customers; (7) Testing migration in sandbox before production.
---

# Polar Migration Guide

Migrate to Polar from other payment platforms while minimizing disruption to your customers and revenue.

## Migration Overview

### What Can Be Migrated

| Data Type | Migration Method |
|-----------|-----------------|
| Customer emails/names | API import |
| Product catalog | Manual recreation |
| Active subscriptions | New subscription creation |
| Payment methods | Customer re-entry required* |
| Historical orders | Not migrated (keep in old system) |
| License keys | New keys generated |

*Payment method tokens cannot be transferred between processors due to PCI compliance. Customers will need to re-enter payment details.

### Migration Strategies

**1. Hard Cutover**
- Cancel all subscriptions in old system
- Create new subscriptions in Polar
- Best for: Small customer base, simple products

**2. Gradual Migration**
- Run both systems in parallel
- Migrate customers as they renew
- Best for: Large customer base, minimizing risk

**3. New Customers Only**
- Keep existing customers on old system
- New customers use Polar
- Best for: Testing Polar before full commitment

## Pre-Migration Checklist

### 1. Set Up Polar

```bash
# Test in sandbox first
# https://sandbox.polar.sh

# Install SDK
npm install @polar-sh/sdk
```

### 2. Map Your Products

Create equivalent products in Polar:

```typescript
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox", // Test first!
});

// Create products matching your old catalog
const basicPlan = await polar.products.create({
  name: "Basic Plan",
  organizationId: "org_xxx",
  description: "Basic features",
  prices: [
    {
      type: "recurring",
      recurringInterval: "month",
      amountType: "fixed",
      priceAmount: 900, // $9.00
      priceCurrency: "usd",
    },
    {
      type: "recurring",
      recurringInterval: "year",
      amountType: "fixed",
      priceAmount: 9000, // $90.00
      priceCurrency: "usd",
    },
  ],
});
```

### 3. Map Benefits/Entitlements

```typescript
// Create benefits in Polar
const licenseBenefit = await polar.benefits.create({
  type: "license_keys",
  description: "Software License",
  organizationId: "org_xxx",
  properties: {
    prefix: "PRO",
    activations: { limit: 3 },
  },
});

// Attach the benefit to the product in the Polar dashboard
// (Organization → Products → [product] → Benefits).
```

### 4. Set Up Webhooks

```typescript
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(
      body,
      {
        "webhook-id": request.headers.get("webhook-id") ?? "",
        "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
        "webhook-signature": request.headers.get("webhook-signature") ?? "",
      },
      process.env.POLAR_WEBHOOK_SECRET!,
    );
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return Response.json({ received: false }, { status: 403 });
    }
    throw error;
  }

  switch (event.type) {
    case "order.paid":
      // Grant access in your system
      await grantAccess(event.data.customer.externalId, event.data.productId);
      break;

    case "subscription.canceled":
      // Schedule access removal
      await scheduleAccessRemoval(event.data.customer.externalId, event.data.endsAt);
      break;
  }

  return Response.json({ received: true });
}
```

See the `polar-integration` skill for the full webhook recipe (event types, framework variations, raw-body requirement, idempotency).

## Migration from Stripe Billing

### Export Customer Data

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Export customers with active subscriptions
async function exportStripeCustomers() {
  const customers: ExportedCustomer[] = [];

  for await (const subscription of stripe.subscriptions.list({ status: "active" })) {
    const customer = await stripe.customers.retrieve(subscription.customer as string);

    if (customer.deleted) continue;

    customers.push({
      stripeCustomerId: customer.id,
      email: customer.email!,
      name: customer.name || undefined,
      subscriptionId: subscription.id,
      productId: subscription.items.data[0].price.product as string,
      priceId: subscription.items.data[0].price.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  return customers;
}
```

### Create Customers in Polar

```typescript
// Map Stripe products to Polar products
const productMap: Record<string, string> = {
  "prod_stripe_basic": "prod_polar_basic",
  "prod_stripe_pro": "prod_polar_pro",
};

async function createPolarCustomers(customers: ExportedCustomer[]) {
  for (const customer of customers) {
    // Create customer in Polar with external ID for linking
    const polarCustomer = await polar.customers.create({
      organizationId: "org_xxx",
      email: customer.email,
      name: customer.name,
      externalId: customer.stripeCustomerId, // Link to Stripe ID
    });

    console.log(`Created Polar customer: ${polarCustomer.id} for ${customer.email}`);
  }
}
```

### Migrate Subscriptions (Gradual)

```typescript
async function migrateSubscription(customer: ExportedCustomer) {
  const polarProductId = productMap[customer.productId];

  // Create checkout for customer to enter new payment method
  const checkout = await polar.checkouts.create({
    products: [polarProductId],
    customerEmail: customer.email,
    externalCustomerId: customer.stripeCustomerId,
    successUrl: `https://yoursite.com/migration-complete?customer=${customer.stripeCustomerId}`,
    // Allow discount for migration
    discountId: "migration_discount_xxx",
  });

  // Send migration email to customer
  await sendMigrationEmail(customer.email, {
    checkoutUrl: checkout.url,
    currentPeriodEnd: customer.currentPeriodEnd,
  });

  return checkout;
}
```

### Handle Migration Completion

```typescript
// Inside the validateEvent switch in your webhook handler:
case "order.paid": {
  const order = event.data;
  const stripeCustomerId = order.customer.externalId;

  if (stripeCustomerId?.startsWith("cus_")) {
    // Cancel Stripe subscription at period end
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
    });

    for (const sub of stripeSubscriptions.data) {
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: true,
      });
    }

    // Mark customer as migrated in your database
    await db.customer.update({
      where: { stripeId: stripeCustomerId },
      data: {
        migratedToPolar: true,
        polarCustomerId: order.customer.id,
      },
    });
  }
  break;
}
```

## Migration from Paddle

### Export Paddle Data

```typescript
// Paddle API to export subscribers
async function exportPaddleSubscribers() {
  const response = await fetch("https://vendors.paddle.com/api/2.0/subscription/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vendor_id: process.env.PADDLE_VENDOR_ID,
      vendor_auth_code: process.env.PADDLE_AUTH_CODE,
      state: "active",
    }),
  });

  const data = await response.json();
  return data.response;
}
```

### Map Paddle to Polar

```typescript
const paddleToPolar = {
  products: {
    "paddle_12345": "polar_basic",
    "paddle_12346": "polar_pro",
  },
};

async function migratePaddleCustomer(paddleUser: PaddleSubscriber) {
  // Create checkout with Polar
  const checkout = await polar.checkouts.create({
    products: [paddleToPolar.products[paddleUser.plan_id]],
    customerEmail: paddleUser.user_email,
    externalCustomerId: `paddle_${paddleUser.user_id}`,
    successUrl: "https://yoursite.com/migrated",
  });

  return checkout;
}
```

## Migration from Lemon Squeezy

```typescript
// Lemon Squeezy API export
async function exportLemonSqueezyCustomers() {
  const response = await fetch("https://api.lemonsqueezy.com/v1/subscriptions", {
    headers: {
      Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
    },
  });

  const { data } = await response.json();
  return data.filter((sub: any) => sub.attributes.status === "active");
}
```

## Customer Communication

### Migration Email Template

```typescript
const migrationEmailTemplate = {
  subject: "Action Required: Update Your Payment Method",
  body: `
Hi {{customer_name}},

We're upgrading our payment system to provide you with a better experience.

**What you need to do:**
Click the link below to update your payment method. This will only take a minute.

[Update Payment Method]({{checkout_url}})

**What's changing:**
- More payment options
- Better invoice management
- Improved customer portal

**What's NOT changing:**
- Your subscription price
- Your features and access
- Your billing date

**Timeline:**
Please complete this by {{deadline}} to ensure uninterrupted service.

Your current subscription will continue until {{current_period_end}}, then
seamlessly transition to our new system.

Questions? Reply to this email.

Thanks,
{{company_name}}
`,
};

async function sendMigrationEmail(email: string, data: MigrationData) {
  // Use your email service (SendGrid, Postmark, etc.)
  await emailService.send({
    to: email,
    subject: migrationEmailTemplate.subject,
    body: renderTemplate(migrationEmailTemplate.body, {
      customer_name: data.name || "there",
      checkout_url: data.checkoutUrl,
      deadline: formatDate(data.deadline),
      current_period_end: formatDate(data.currentPeriodEnd),
      company_name: "Your Company",
    }),
  });
}
```

### Reminder Sequence

```typescript
const reminderSchedule = [
  { daysBeforeDeadline: 14, template: "initial" },
  { daysBeforeDeadline: 7, template: "reminder" },
  { daysBeforeDeadline: 3, template: "urgent" },
  { daysBeforeDeadline: 1, template: "final" },
];

async function scheduleReminders(customer: Customer, deadline: Date) {
  for (const reminder of reminderSchedule) {
    const sendAt = subDays(deadline, reminder.daysBeforeDeadline);

    await scheduleEmail({
      to: customer.email,
      template: reminder.template,
      sendAt,
      data: { checkoutUrl: customer.migrationCheckoutUrl },
    });
  }
}
```

## Parallel Running

### Router Pattern

```typescript
// Determine which system handles a customer
async function getPaymentSystem(userId: string): Promise<"stripe" | "polar"> {
  const user = await db.user.findUnique({ where: { id: userId } });

  if (user?.polarCustomerId) {
    return "polar";
  }
  return "stripe";
}

// Route subscription checks
async function hasActiveSubscription(userId: string): Promise<boolean> {
  const system = await getPaymentSystem(userId);

  if (system === "polar") {
    const state = await polar.customers.getState({
      customerId: user.polarCustomerId,
    });
    return state.activeSubscriptions.length > 0;
  } else {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
    });
    return subscriptions.data.length > 0;
  }
}
```

### Unified Webhook Handler

```typescript
// Handle webhooks from both systems during migration
app.post("/webhooks/stripe", stripeWebhookHandler);
app.post("/webhooks/polar", polarWebhookHandler);

// Normalize events to your internal format
interface SubscriptionEvent {
  type: "created" | "canceled" | "renewed";
  customerId: string;
  productId: string;
  source: "stripe" | "polar";
}

function normalizeStripeEvent(event: Stripe.Event): SubscriptionEvent | null {
  // Convert Stripe event to internal format
}

function normalizePolarEvent(event: PolarWebhookEvent): SubscriptionEvent | null {
  // Convert Polar event to internal format
}
```

## Post-Migration Cleanup

### Verify Migration

```typescript
async function verifyMigration() {
  // Get all customers marked as migrated
  const migratedCustomers = await db.customer.findMany({
    where: { migratedToPolar: true },
  });

  const issues: string[] = [];

  for (const customer of migratedCustomers) {
    // Verify Polar subscription exists
    const polarState = await polar.customers.getState({
      customerId: customer.polarCustomerId,
    });

    if (polarState.activeSubscriptions.length === 0) {
      issues.push(`${customer.email}: No active Polar subscription`);
    }

    // Verify Stripe subscription is canceled
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: customer.stripeCustomerId,
      status: "active",
    });

    if (stripeSubscriptions.data.length > 0) {
      issues.push(`${customer.email}: Stripe subscription still active`);
    }
  }

  return issues;
}
```

### Cancel Old System

```typescript
// After all customers migrated, cancel remaining Stripe subscriptions
async function cancelRemainingStripeSubscriptions() {
  for await (const subscription of stripe.subscriptions.list({ status: "active" })) {
    // Check if customer was migrated
    const customer = await db.customer.findFirst({
      where: { stripeId: subscription.customer as string },
    });

    if (customer?.migratedToPolar) {
      await stripe.subscriptions.cancel(subscription.id);
      console.log(`Canceled Stripe subscription ${subscription.id}`);
    }
  }
}
```

## Migration Checklist

### Before Migration

- [ ] Products created in Polar (sandbox)
- [ ] Benefits/entitlements mapped
- [ ] Webhooks configured
- [ ] Email templates ready
- [ ] Customer support informed
- [ ] Rollback plan documented

### During Migration

- [ ] Test with small batch first
- [ ] Monitor error rates
- [ ] Track conversion rate
- [ ] Respond to customer issues quickly
- [ ] Send reminder emails on schedule

### After Migration

- [ ] Verify all subscriptions migrated
- [ ] Cancel old platform subscriptions
- [ ] Update documentation
- [ ] Remove old platform code
- [ ] Archive old platform data
- [ ] Celebrate! 🎉

## Troubleshooting

**Customer didn't receive migration email**
- Check spam folder
- Verify email address in export
- Resend with different subject line

**Customer completed checkout but Stripe not canceled**
- Check webhook logs
- Verify external_id mapping
- Manually cancel if needed

**Double billing**
- Refund on old platform
- Apologize to customer
- Improve timing logic

**Customer wants to stay on old platform**
- Respect their choice (if possible)
- Offer incentive to migrate
- Set final deadline
