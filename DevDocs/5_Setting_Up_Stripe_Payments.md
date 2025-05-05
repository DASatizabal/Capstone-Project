# Setting Up Stripe Payments in Next.js

## Introduction

Stripe is a comprehensive payment processing platform that enables businesses to accept credit cards, digital wallets, and other payment methods online. This guide walks you through setting up a Stripe account, creating a sandbox environment for testing, obtaining API keys, configuring webhooks, and integrating these elements into your Next.js application.

## Prerequisites

- A Next.js application
- A business email address
- A phone number for verification
- Basic details about your business or project

## Step 1: Create and Configure a Stripe Account

1. Visit [Stripe's website](https://stripe.com/) and click **Start now** or **Create account**
2. Enter your email address, full name, and set a strong password
3. Verify your email address by clicking the link sent to your inbox
4. Complete the preliminary questions about your business:
   - Business type (Individual, Company, Non-profit, etc.)
   - Industry/category
   - Country of operation
   - Primary business address
5. **Important additional configuration steps:**
   - In your **Settings > Public Details**, add your website URL
   - In your **Settings > Branding**, add your logo & colors
   - In your **Settings > Customer Emails**, turn on emails for successful payments & refunds
   - In your **Settings > Customer Portal**, activate link to customer portal for future use
   - In the search box, type 'rules' and click **Fraud Prevention > Rules**, make sure the first 3DS rule is enabled (recommended to also enable the second one)
   - Ensure you block payments if CVC fails

## Step 2: Access the Stripe Dashboard

After creating your account, you'll access the Stripe Dashboard, which serves as your control center for all Stripe operations. Note that new accounts start in **Test Mode** by default, which is perfect for development.

## Step 3: Enable Test Mode and Obtain API Keys

1. **Turn ON Test Mode** in the Stripe Dashboard - this is essential for development
2. In the Stripe Dashboard, click on **Developers** in the left sidebar
3. Select **API keys**
4. You'll see two types of keys:
   - **Publishable key**: Safe to include in your frontend code
   - **Secret key**: Must be kept secure and only used in server-side code
5. For development, you'll use the **Test** versions of these keys
6. Click on the **Reveal test key** button to view your secret key
7. Copy both the publishable and secret test keys
8. Add them to your `.env` file:
   ```
   STRIPE_PUBLIC_KEY=pk_test_your_publishable_key
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   ```

## Step 4: Set Up Webhook Endpoints

Webhooks allow Stripe to notify your application about events that happen in your account, such as successful payments or failed charges.

1. In the Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. For local development, you'll need to expose your localhost to the internet. Options include:
   - [ngrok](https://ngrok.com/)
   - [Stripe CLI](https://stripe.com/docs/stripe-cli)
   - [localtunnel](https://github.com/localtunnel/localtunnel)

### Using Stripe CLI for Local Development

1. Install the Stripe CLI by following the [installation instructions](https://stripe.com/docs/stripe-cli#install)
2. Open a terminal and run:
   ```bash
   stripe login
   ```
3. Follow the prompts to authenticate with your Stripe account
4. Start the webhook forwarding:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhook/stripe
   ```
   Note the endpoint path is `/api/webhook/stripe` (not `/webhooks/`)
5. The CLI will output a webhook signing secret. Copy this secret
6. **Important:** Add the webhook secret to your `.env` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
   ```

### For Production

**When you're ready to go live with real payments:**

1. **Turn OFF Test Mode** in your Stripe Dashboard
2. In your **Developers** section, copy your **live** public & private keys (different from test keys)
3. Add these live keys to your production environment variables:
   ```
   STRIPE_PUBLIC_KEY=pk_live_your_publishable_key
   STRIPE_SECRET_KEY=sk_live_your_secret_key
   ```
4. In the Stripe Dashboard, go to **Developers > Webhooks**
5. Click **Add endpoint**
6. Enter your production webhook URL (e.g., `https://yourdomain.com/api/webhook/stripe`)
   Note the path is `/api/webhook/stripe` (not `/webhooks/`)
7. Select the events you want to receive notifications for, particularly:
   - `checkout.session.completed` (essential)
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
8. Click **Add endpoint**
9. Once created, click on the endpoint to view its details
10. Click **Reveal** to see the signing secret and add it to your production environment:
    ```
    STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_signing_secret
    ```
11. **Optional but recommended:**
    - In **Balance > Manage Payouts**, set a specific date of the month to receive your payouts (e.g., the 10th)
    - Double-check that your customer emails are activated in **Settings > Customer Emails**

## Step 5: Update Environment Variables

1. Open your `.env` file (or create one if it doesn't exist)
2. Add the following Stripe variables:

```env
# Stripe API Keys
STRIPE_PUBLIC_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

# Optional - For subscription products
STRIPE_PRICE_ID=price_your_price_id
```

3. Make sure to update your `.env.sample` file (without the actual keys) for documentation purposes

## Step 6: Set Up Products and Prices in Stripe

**This step is critical for your application to function correctly.**

For subscription-based applications, you'll need to create products and prices in Stripe.

1. In the Stripe Dashboard, go to **Products**
2. Click **Add product**
3. Fill in the product details:
   - Name
   - Description
   - Images (optional)
4. Under **Pricing**, set up your pricing model:
   - One-time or recurring payment
   - Currency and amount
   - Billing interval (monthly, yearly, etc.) for subscriptions
5. Click **Save product**
6. **Important:** After creating the product, find the **Price ID** (starts with `price_`)
7. **You must add this Price ID to your application configuration:**
   - Open `config.ts` file
   - Find the Stripe plans configuration section
   - Update the `priceId` field with your actual Stripe Price ID
   ```typescript
   // In config.ts
   stripe: {
     plans: [
       {
         name: 'Basic',
         priceId: 'price_XXXXXXXXX', // Replace with your actual Price ID
         // Other plan details...
       },
       // Other plans...
     ],
   },
   ```

## Step 7: Install Stripe in Your Next.js Project

```bash
npm install stripe @stripe/stripe-js
# or
yarn add stripe @stripe/stripe-js
```

## Step 8: Create Server-Side Stripe Instance

Create a file at `libs/stripe.ts`:

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest version
  appInfo: {
    name: 'FeNAgO',
    version: '0.1.0',
  },
});

export default stripe;
```

## Step 9: Create Client-Side Stripe Configuration

Create a file at `libs/stripe-client.ts`:

```typescript
import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);
  }
  return stripePromise;
};

export default getStripe;
```

## Step 10: Create a Checkout API Route

Create a file at `app/api/stripe/checkout/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import stripe from '@/libs/stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a checkout session' },
        { status: 401 }
      );
    }
    
    const { priceId } = await req.json();
    
    // Create a checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: session.user.email!,
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment/canceled`,
      metadata: {
        userId: session.user.id,
      },
    });
    
    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
```

## Step 11: Create a Webhook Handler

Create a file at `app/api/webhooks/stripe/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/libs/stripe';

// Disable body parsing, need the raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: Request): Promise<Buffer> {
  const arrayBuffer = await req.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: Request) {
  try {
    const body = await getRawBody(req);
    const signature = headers().get('stripe-signature') as string;
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing Stripe webhook secret' },
        { status: 500 }
      );
    }
    
    const event = stripe.webhooks.constructEvent(
      body.toString(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        // Handle successful checkout
        console.log('Checkout completed:', checkoutSession);
        
        // Update the user's subscription status in your database
        if (checkoutSession.metadata?.userId) {
          // Update user subscription status
          console.log('Updating subscription for user:', checkoutSession.metadata.userId);
        }
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription updates
        console.log('Subscription updated:', subscription);
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        // Handle successful invoice payment
        console.log('Invoice paid:', invoice);
        break;
        
      // Add other events as needed
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
```

## Step 12: Create a Simple Checkout Button Component

Create a file at `components/CheckoutButton.tsx`:

```tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import getStripe from '@/libs/stripe-client';

interface CheckoutButtonProps {
  priceId?: string;
  text?: string;
}

export default function CheckoutButton({
  priceId,
  text = 'Subscribe Now',
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      const { url, sessionId, error } = await response.json();

      if (error) {
        console.error('Checkout error:', error);
        setLoading(false);
        return;
      }

      // If we have a direct URL, redirect to it
      if (url) {
        router.push(url);
        return;
      }

      // Otherwise use the client-side Stripe SDK
      const stripe = await getStripe();
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        console.error('Stripe error:', stripeError);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {loading ? 'Processing...' : text}
    </button>
  );
}
```

## Step 13: Testing Your Stripe Integration

1. Start your Next.js development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. In a separate terminal, start the Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

3. Add the `CheckoutButton` component to a page where users can subscribe

4. Test a complete checkout flow using Stripe's test card numbers:
   - Test successful payment: `4242 4242 4242 4242`
   - Test requires authentication: `4000 0025 0000 3155`
   - Test declined payment: `4000 0000 0000 9995`

5. Verify that webhook events are being received and processed correctly

## Step 14: Go Live with Stripe

When you're ready to accept real payments:

1. Complete your Stripe account setup with business and banking details
2. Switch from test mode to live mode in the Stripe Dashboard
3. Replace test API keys with live API keys in your environment variables
4. Update your webhook endpoint to use your production URL
5. Verify the configuration with a test purchase using your own card

## Handling Subscriptions and Checkout

### Creating a Checkout Session

Your FeNAgO application includes a `ButtonCheckout` component that simplifies the checkout process. Use this component to initiate payment flows without having to build custom checkout forms.

```tsx
// Example usage in a page component
import ButtonCheckout from '@/components/ButtonCheckout';

export default function PricingPage() {
  return (
    <div>
      {/* Your pricing content */}
      <ButtonCheckout priceId={config.stripe.plans[0].priceId} />
    </div>
  );
}
```

### Webhook Event Handling

The application listens to Stripe webhook events to update user access based on payment status. Specifically:

- The webhook handler in `/api/webhook/stripe` processes incoming Stripe events
- When a `checkout.session.completed` event is received, the user's subscription status is updated
- The handler sets a boolean `hasAccess` flag to control access to premium features

You can extend the webhook handler to implement your own business logic, such as:
- Adding credits to a user account
- Sending email with purchased digital products
- Activating additional features
- Tracking conversion analytics

### Troubleshooting Common Stripe Issues

#### Payments Not Being Processed

Check for:
- Incorrect API keys (test vs. live)
- Missing or incorrect webhook configuration
- Firewall or security settings blocking webhooks

#### Webhook Failures

Resolve with:
- Ensuring the webhook secret is correctly set in your environment
- Checking webhook logs in Stripe Dashboard
- Testing with the Stripe CLI in development

#### Access Control Issues

Improve by:
- Verifying the subscription status update logic
- Checking database connections
- Testing the entire payment flow end-to-end

## Security Best Practices

1. **Keep Secret Keys Secure**:
   - Never expose your secret key in client-side code
   - Store keys in environment variables, not in your codebase
   - Rotate keys if you suspect they've been compromised

2. **Validate Webhook Signatures**:
   - Always verify webhook signatures to prevent fraud
   - Use Stripe's built-in signature verification

3. **Implement Proper Error Handling**:
   - Don't expose detailed error messages to users
   - Log errors server-side for debugging

4. **Use HTTPS**:
   - Always use HTTPS for production environments
   - Local development should use secure approaches for testing webhooks

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Next.js and Stripe Integration Guide](https://stripe.com/docs/payments/checkout/quickstart)

---

By following this guide, you should have a fully functional Stripe integration in your Next.js application, allowing you to accept payments, handle subscriptions, and process webhook events securely and efficiently.
