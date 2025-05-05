# FeNAgO Payment Integration

## Overview

FeNAgO integrates with Stripe for payment processing, subscription management, and billing. This document outlines the payment architecture, configuration, and implementation details.

## Stripe Integration

### Configuration

The Stripe integration is configured in two main locations:

1. **Environment Variables**:
   - `STRIPE_SECRET_KEY`: For server-side API calls
   - `STRIPE_PUBLIC_KEY`: For client-side components
   - `STRIPE_WEBHOOK_SECRET`: For verifying webhook signatures

2. **Config File**:
   The `config.ts` file contains the plan definitions including:
   - Price IDs
   - Plan names and descriptions
   - Features included in each plan
   - Pricing details

```typescript
stripe: {
  plans: [
    {
      priceId: "price_123",
      name: "Starter",
      description: "Perfect for small projects",
      price: 99,
      features: [ /* features list */ ],
    },
    // Other plans
  ],
},
```

### Key Components

#### Server-Side Stripe Client

**File**: `/libs/stripe.ts`

Initializes the Stripe client and provides utility functions for working with Stripe:

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16", // Update to the latest API version
});

// Utility functions for working with Stripe
```

#### Checkout Component

**File**: `/components/ButtonCheckout.tsx`

Provides a button component that initiates the Stripe checkout process:

```typescript
const ButtonCheckout = ({ priceId }) => {
  const handleCheckout = async () => {
    // Call API endpoint to create checkout session
    // Redirect to Stripe checkout
  };
  
  return <button onClick={handleCheckout}>Subscribe</button>;
};
```

#### Pricing Component

**File**: `/components/Pricing.tsx`

Displays subscription plans and pricing options based on configuration:

```typescript
import config from "@/config";

const Pricing = () => {
  return (
    <div>
      {config.stripe.plans.map((plan) => (
        <PlanCard key={plan.priceId} plan={plan} />
      ))}
    </div>
  );
};
```

#### Checkout API Endpoint

**File**: `/app/api/stripe/checkout/route.ts`

Creates Stripe checkout sessions for subscription payments:

```typescript
import { stripe } from "@/libs/stripe";

export async function POST(req: Request) {
  const { priceId, successUrl, cancelUrl } = await req.json();
  
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}?canceled=true`,
    // Other options
  });
  
  return Response.json({ checkoutUrl: session.url });
}
```

#### Customer Portal API Endpoint

**File**: `/app/api/stripe/customer-portal/route.ts`

Generates Stripe customer portal URLs for managing subscriptions:

```typescript
import { stripe } from "@/libs/stripe";

export async function POST(req: Request) {
  const { user } = await getServerSession();
  
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  });
  
  return Response.json({ portalUrl: session.url });
}
```

#### Webhook Handler

**File**: `/app/api/webhook/stripe/route.ts`

Processes Stripe webhook events for subscription management:

```typescript
import { stripe } from "@/libs/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    
    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        // Process successful checkout
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        // Update subscription status
        break;
      // Other cases
    }
    
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
```

## Subscription Workflow

### New Subscription

1. User selects a plan from the pricing page
2. User clicks "Subscribe" button
3. Frontend calls `/api/stripe/checkout` endpoint
4. User is redirected to Stripe checkout page
5. User completes payment
6. Stripe sends webhook event (`checkout.session.completed`)
7. FeNAgO updates user record with subscription details
8. User is redirected to success page/dashboard

### Subscription Management

1. User navigates to account/billing page
2. User clicks "Manage Subscription" button
3. Frontend calls `/api/stripe/customer-portal` endpoint
4. User is redirected to Stripe customer portal
5. User makes changes (upgrade, downgrade, cancel)
6. Stripe sends webhook events with changes
7. FeNAgO updates user record accordingly
8. User is redirected back to FeNAgO

## User Subscription Data

Subscription information is stored in the User model:

```typescript
interface UserDocument extends Document {
  // Other user fields
  stripePriceId?: string;         // Current plan price ID
  stripeCustomerId?: string;      // Stripe customer ID
  stripeSubscriptionId?: string;  // Stripe subscription ID
  stripeSubscriptionStatus?: string; // Subscription status
}
```

## Testing Stripe Integration

### Test Mode

During development, use Stripe test mode with test API keys and test cards:

- Test Card: `4242 4242 4242 4242` (successful payment)
- Test Card: `4000 0000 0000 9995` (insufficient funds)

### Local Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

## Production Considerations

### Security

1. **Environment Variables**: Keep Stripe keys secure
2. **Webhook Signatures**: Always verify webhook signatures
3. **HTTPS**: Ensure all payment pages use HTTPS

### Compliance

1. **Terms of Service**: Update with payment terms
2. **Privacy Policy**: Include how payment data is handled
3. **Refund Policy**: Document your refund process

## Agentic Payment Features

For the FeNAgO agentic platform, consider implementing these payment features:

### 1. Usage-Based Billing

Implement metered billing based on:
- Number of agents created
- Conversation tokens used
- API calls made

### 2. Credit System

Create a token/credit system for agent usage:
- Purchase credits in bundles
- Track credit consumption
- Implement auto-refill options

### 3. Tiered Access

Implement feature access tiers:
- Basic: Limited agents and features
- Pro: More agents and capabilities
- Enterprise: Custom agents and integrations
