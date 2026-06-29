---
name: polar-integration
description: Add Polar billing to a TypeScript/JavaScript app using the @polar-sh/sdk package. Use this skill whenever the user wants to add a Checkout endpoint, a Customer Portal endpoint, or a Webhooks endpoint for Polar to any framework — Next.js, Express, Hono, Astro, SvelteKit, Remix, TanStack Start, Nuxt, Fastify, Elysia, Deno, Supabase Edge Functions, Cloudflare Workers, Bun, etc.
---

# Polar SDK integration

A standalone guide to wiring up Polar's three core HTTP endpoints — Checkout, Customer Portal, and Webhooks — using `@polar-sh/sdk` directly. The recipes are framework-agnostic Web Standards (`Request`/`Response`); each section also lists the small idiomatic adjustments per framework.

## Setup

Install the SDK:

```bash
npm install @polar-sh/sdk
# or pnpm / yarn / bun
```

Don't install `@polar-sh/<framework>` packages (e.g. `@polar-sh/nextjs`, `@polar-sh/express`, `@polar-sh/hono`, etc.) — they are deprecated. `@polar-sh/sdk` is all you need for these recipes.

Required environment variables (use whatever loader your framework provides — `process.env`, `Deno.env`, `import.meta.env`, etc.):

- `POLAR_ACCESS_TOKEN` — organization access token from the Polar dashboard.
- `POLAR_WEBHOOK_SECRET` — only needed for the webhook recipe.
- `POLAR_SERVER` — set to `sandbox` while developing, omit (or `production`) in prod.

Construct one client and reuse it:

```ts
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "production",
});
```

The three recipes below are independent — implement only the ones the user asks for.

---

## Recipe 1 — Checkout endpoint

**Goal:** an HTTP endpoint that creates a Polar checkout session and 302-redirects the browser to the hosted checkout page.

**Underlying API:** `POST /v1/checkouts/` (SDK: `polar.checkouts.create(...)`). Full schema: <https://polar.sh/docs/api-reference/checkouts/create-session>.

### `polar.checkouts.create()` field reference

The SDK uses `camelCase`; the underlying HTTP API uses `snake_case`. Pick whichever you see in the user's existing code.

| SDK field (camelCase) | API field (snake_case) | Required | Notes |
|---|---|---|---|
| `products` | `products` | yes | Array of product UUIDs. The first is selected by default. |
| `customerId` | `customer_id` | no | Existing Polar customer ID. |
| `externalCustomerId` | `external_customer_id` | no | Your own user ID. If no Polar customer matches, one is created with this external ID. |
| `customerEmail` | `customer_email` | no | |
| `customerName` | `customer_name` | no | |
| `customerBillingName` | `customer_billing_name` | no | |
| `customerBillingAddress` | `customer_billing_address` | no | `{ country: "US", line1, line2, city, state, postal_code }`. `country` (ISO alpha-2) is required if address is set. |
| `customerTaxId` | `customer_tax_id` | no | |
| `customerIpAddress` | `customer_ip_address` | no | |
| `customerMetadata` | `customer_metadata` | no | Copied to the created customer. |
| `isBusinessCustomer` | `is_business_customer` | no | Default `false`. If `true`, full billing address + name required. |
| `metadata` | `metadata` | no | Copied to the resulting order/subscription. |
| `customFieldData` | `custom_field_data` | no | Map of custom field slug → value. |
| `discountId` | `discount_id` | no | |
| `allowDiscountCodes` | `allow_discount_codes` | no | Default `true`. |
| `requireBillingAddress` | `require_billing_address` | no | Default `false`. US customers always required regardless. |
| `seats` | `seats` | no | Predefined number of seats (seat-based pricing only). |
| `minSeats` / `maxSeats` | `min_seats` / `max_seats` | no | Seat-based pricing only. |
| `amount` | `amount` | no | Cents. Only used for `custom` (pay-what-you-want) prices. |
| `subscriptionId` | `subscription_id` | no | Upgrade an existing free subscription. |
| `successUrl` | `success_url` | no | See below. |
| `returnUrl` | `return_url` | no | Back-button URL on the checkout page. |
| `embedOrigin` | `embed_origin` | no | Set when embedding the checkout in an iframe. |
| `locale` | `locale` | no | IETF BCP 47 (`en`, `en-US`, `fr-CA`, ...). Defaults to `en-US`. |
| `currency` | `currency` | no | ISO 4217 (e.g. `usd`, `eur`). |
| `trialInterval` / `trialIntervalCount` | `trial_interval` / `trial_interval_count` | no | Override product trial. |
| `allowTrial` | `allow_trial` | no | Default `true`. Set `false` to disable an otherwise-configured trial. |
| `prices` | `prices` | no | Map of product ID → ad-hoc prices (override catalog prices). |

**Response:** `{ id, url, client_secret, expires_at, status, ... }`. Redirect the user to `url`. `client_secret` is only needed if you are embedding the checkout via `@polar-sh/checkout`.

### Notes on specific fields

- **`successUrl` and `{CHECKOUT_ID}`.** Polar performs a literal string substitution: any `{CHECKOUT_ID}` token in the URL is replaced with the actual session ID at redirect time. The official API docs example uses `?checkout_id={CHECKOUT_ID}`; you can use any param name you want. Useful when your success page needs to fetch the session via `polar.checkouts.get(checkoutId)`.
- **`theme` (UI hint, not an API field).** The hosted checkout UI accepts `?theme=light|dark` in the URL. To apply a theme, append it to `result.url` *after* creating the session — it's not a field on `polar.checkouts.create()`.

### Canonical implementation (Web Standards — Request/Response)

Works as-is in Deno, Bun, Cloudflare Workers, Supabase Edge Functions, SvelteKit, Remix, TanStack Start, Astro endpoints, and Next.js Route Handlers (NextRequest extends Request).

```ts
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "production",
});

const SUCCESS_URL = "https://example.com/success?checkoutId={CHECKOUT_ID}";
const THEME: "light" | "dark" | undefined = undefined;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const products = url.searchParams.getAll("products");

  if (products.length === 0) {
    return Response.json(
      { error: "Missing products in query params" },
      { status: 400 },
    );
  }

  const json = (key: string) =>
    url.searchParams.has(key)
      ? JSON.parse(url.searchParams.get(key) ?? "{}")
      : undefined;
  const str = (key: string) => url.searchParams.get(key) ?? undefined;

  try {
    const result = await polar.checkouts.create({
      products,
      successUrl: SUCCESS_URL,
      customerId: str("customerId"),
      externalCustomerId: str("customerExternalId"),
      customerEmail: str("customerEmail"),
      customerName: str("customerName"),
      customerBillingAddress: json("customerBillingAddress"),
      customerTaxId: str("customerTaxId"),
      customerIpAddress: str("customerIpAddress"),
      customerMetadata: json("customerMetadata"),
      metadata: json("metadata"),
      discountId: str("discountId"),
      allowDiscountCodes: url.searchParams.has("allowDiscountCodes")
        ? url.searchParams.get("allowDiscountCodes") === "true"
        : undefined,
      seats: url.searchParams.has("seats")
        ? Number.parseInt(url.searchParams.get("seats") ?? "1", 10)
        : undefined,
    });

    const redirectUrl = new URL(result.url);
    if (THEME) redirectUrl.searchParams.set("theme", THEME);

    return Response.redirect(redirectUrl.toString(), 302);
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 500 });
  }
}
```

This handler accepts a GET request with `?products=<product_id>` and forwards optional customer-prefill params straight to `polar.checkouts.create()`. Drop fields the caller won't ever provide; add fields from the table above (`metadata`, `embedOrigin`, `locale`, ...) as needed for your use case. If your frontend is server-rendered and already knows the user, hardcode `externalCustomerId` from your auth context instead of reading it from the query.

### Framework variations

The body of the handler is identical — only the signature, URL access, and response constructors change.

**Next.js (App Router):** put the canonical handler in `app/api/checkout/route.ts`. `NextRequest`/`NextResponse` are optional; `request: Request` works.

**Express:**

```ts
import type { Request, Response } from "express";

app.get("/checkout", async (req: Request, res: Response) => {
  const url = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
  // ... same body using `url.searchParams` ...
  // res.redirect(redirectUrl.toString());
  // res.status(400).json({ error: "..." });
});
```

**Fastify:**

```ts
fastify.get("/checkout", async (request, reply) => {
  const url = new URL(`${request.protocol}://${request.hostname}${request.url}`);
  // ... same body ...
  // reply.redirect(redirectUrl.toString());
});
```

**Hono:**

```ts
app.get("/checkout", async (c) => {
  const url = new URL(c.req.url);
  // ... same body ...
  return c.redirect(redirectUrl.toString());
});
```

**Elysia:**

```ts
app.get("/checkout", ({ request, redirect }) => {
  const url = new URL(request.url);
  // ... same body, `return redirect(redirectUrl.toString())` ...
});
```

**Nuxt (server route):** `server/api/checkout.get.ts` using `defineEventHandler`, `getQuery`, `sendRedirect(event, url, 302)`.

**SvelteKit:** `src/routes/api/checkout/+server.ts` exporting `GET({ request, url })` — the canonical handler works directly.

**Astro:** `src/pages/api/checkout.ts` exporting `export const GET: APIRoute = async ({ request }) => { ... }`.

---

## Recipe 2 — Customer Portal endpoint

**Goal:** an authenticated endpoint that creates a Polar customer session and 302-redirects to the hosted customer portal (subscriptions, invoices, payment methods).

**Underlying API:** `POST /v1/customer-sessions/` (SDK: `polar.customerSessions.create(...)`). Full schema: <https://polar.sh/docs/api-reference/customer-portal/sessions/create>.

### `polar.customerSessions.create()` field reference

The request body is a union — pass **either** `customerId` **or** `externalCustomerId`, not both.

| SDK field | API field | Required | Notes |
|---|---|---|---|
| `customerId` | `customer_id` | one of these two | Existing Polar customer UUID. |
| `externalCustomerId` | `external_customer_id` | one of these two | Your own user ID. |
| `returnUrl` | `return_url` | no | Back-button URL on the portal page. |
| `memberId` | `member_id` | no | Only for orgs with `member_model_enabled`. Polar customer member UUID. Defaults to the owner member for individual customers. |
| `externalMemberId` | `external_member_id` | no | Your member ID, alternative to `memberId`. |

**Response:** `{ id, customer_portal_url, token, expires_at, customer, customer_id, return_url, ... }`. Redirect the user to `customer_portal_url`. `token` and `customer` are useful if you want to render portal data inside your own UI instead of redirecting.

### Canonical implementation

```ts
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "production",
});

const RETURN_URL = "https://example.com/account";

// Replace with your auth: read a cookie/JWT/session and return your user id.
async function getExternalCustomerId(request: Request): Promise<string | null> {
  const session = await getSession(request); // your auth helper
  return session?.userId ?? null;
}

export async function GET(request: Request): Promise<Response> {
  const externalCustomerId = await getExternalCustomerId(request);
  if (!externalCustomerId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { customerPortalUrl } = await polar.customerSessions.create({
      externalCustomerId,
      returnUrl: RETURN_URL,
    });
    return Response.redirect(customerPortalUrl, 302);
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 500 });
  }
}
```

If you have a Polar customer ID instead of your own user ID, swap `externalCustomerId` for `customerId` in the `polar.customerSessions.create({ ... })` call. `externalCustomerId` is usually what you want — your auth system already knows the user's ID.

### Framework variations

Same shape as Checkout — only the request/response idioms change. Read auth state however your framework expects (Next.js: `cookies()` from `next/headers`, Express: `req.user`, Hono: `c.get('user')`, etc.) and pass the result into `polar.customerSessions.create`.

---

## Recipe 3 — Webhooks endpoint

**Goal:** receive Polar webhook events, verify the signature, and dispatch to per-event handlers.

**Contract:** POST endpoint at a stable URL configured in the Polar dashboard. Verifies the `webhook-id`, `webhook-timestamp`, `webhook-signature` headers using `validateEvent` from `@polar-sh/sdk/webhooks`. Returns 200 on success, 403 on signature mismatch.

### Canonical implementation

```ts
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET!;

export async function POST(request: Request): Promise<Response> {
  const body = await request.text(); // must be the raw body, not parsed JSON

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(
      body,
      {
        "webhook-id": request.headers.get("webhook-id") ?? "",
        "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
        "webhook-signature": request.headers.get("webhook-signature") ?? "",
      },
      WEBHOOK_SECRET,
    );
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return Response.json({ received: false }, { status: 403 });
    }
    throw error;
  }

  switch (event.type) {
    case "checkout.created":
    case "checkout.updated":
      // event.data is the Checkout
      break;

    case "order.created":
    case "order.updated":
    case "order.paid":
    case "order.refunded":
      // event.data is the Order — fulfill, send receipt, etc.
      break;

    case "subscription.created":
    case "subscription.updated":
    case "subscription.active":
    case "subscription.canceled":
    case "subscription.uncanceled":
    case "subscription.revoked":
      // event.data is the Subscription — flip entitlements in your DB
      break;

    case "refund.created":
    case "refund.updated":
      break;

    case "product.created":
    case "product.updated":
      break;

    case "benefit.created":
    case "benefit.updated":
      break;

    case "benefit_grant.created":
    case "benefit_grant.updated":
    case "benefit_grant.revoked":
      // grant or revoke the user's access to a benefit
      break;

    case "customer.created":
    case "customer.updated":
    case "customer.deleted":
    case "customer.state_changed":
      break;

    case "organization.updated":
      break;
  }

  return Response.json({ received: true });
}
```

`event` is fully typed — TypeScript will narrow `event.data` inside each `case`.

### Critical details

1. **Use the raw request body** for `validateEvent`. If your framework parsed JSON for you (Express's `express.json()`, Fastify's default body parser), disable it on this route or read the raw body manually. Signature verification fails on re-serialized JSON.
2. **Respond fast.** Polar retries on non-2xx and on timeouts. If a handler is slow (sending email, syncing inventory), enqueue it (queue/cron/background job) and return 200 immediately.
3. **Idempotency.** Polar may redeliver. Deduplicate on the `webhook-id` header — it's unique per delivery and reused on retries (Standard Webhooks spec). Don't dedupe on `event.data.id`: that's the resource ID and is shared across distinct events about the same resource (e.g. `order.created` and `order.paid`).

### Framework variations

**Next.js Route Handler:** drop the canonical handler into `app/api/polar/webhook/route.ts`. App Router does not auto-parse the body, so `request.text()` is correct.

**Express:** mount with the raw body parser on this route only:

```ts
app.post("/polar/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const body = (req.body as Buffer).toString("utf8");
  // ... validateEvent / switch ...
  res.json({ received: true });
});
```

**Fastify:** add a content-type parser that preserves the raw body, or use `request.rawBody` with `@fastify/raw-body`.

**Hono:** `await c.req.text()` returns the raw body, and `c.req.header("webhook-id")` reads headers.

**Elysia:** `await request.text()` on the standard `Request`.

**SvelteKit:** in `+server.ts`, `await event.request.text()`.

**Astro:** in `APIRoute`, `await request.text()`.

**Nuxt:** `await readRawBody(event)` from h3.

---

- Don't install `@polar-sh/<framework>` packages (e.g. `@polar-sh/express`) — they are deprecated. `@polar-sh/sdk` is all you need for these recipes. The only exceptions are `@polar-sh/nextjs` for Next.js App Router and `@polar-sh/better-auth` for Better Auth.

