# FeNAgO API Endpoints Documentation

## Overview

FeNAgO provides a set of API endpoints built on Next.js API routes. These endpoints handle authentication, payment processing, lead generation, and webhooks. This document outlines the available endpoints and their functionality.

## Authentication API

### `/api/auth/[...nextauth]`

**Purpose**: Handles all authentication-related functionality through NextAuth.js

**Features**:
- Login/Logout
- Session management
- OAuth provider authentication (Google)
- Magic link email authentication
- CSRF protection

**Implementation**: Uses NextAuth.js with MongoDB adapter for user data storage

## Payment Processing API

### `/api/stripe/checkout`

**Purpose**: Creates Stripe checkout sessions for subscription payments

**Method**: POST

**Request Body**:
```typescript
{
  priceId: string;  // The Stripe price ID from config
  successUrl?: string;  // Optional redirect URL on success
  cancelUrl?: string;  // Optional redirect URL on cancel
}
```

**Response**:
```typescript
{
  checkoutUrl: string;  // URL to redirect user to Stripe checkout
}
```

### `/api/stripe/customer-portal`

**Purpose**: Generates Stripe customer portal URLs for managing subscriptions

**Method**: POST

**Request Body**:
```typescript
{
  returnUrl?: string;  // Optional URL to return to after portal session
}
```

**Response**:
```typescript
{
  portalUrl: string;  // URL to redirect user to Stripe customer portal
}
```

## Lead Generation API

### `/api/lead/capture`

**Purpose**: Captures lead information from website forms

**Method**: POST

**Request Body**:
```typescript
{
  email: string;  // Lead's email address
  name?: string;  // Optional lead name
  source?: string;  // Optional source tracking
  // Additional custom fields as needed
}
```

**Response**:
```typescript
{
  success: boolean;  // Whether lead was captured successfully
  message?: string;  // Optional success/error message
}
```

## Webhook Handlers

### `/api/webhook/stripe`

**Purpose**: Handles Stripe webhook events for subscription management

**Method**: POST

**Request Body**: Raw Stripe webhook event

**Handled Events**:
- `checkout.session.completed`: Process successful checkout
- `customer.subscription.created`: Handle new subscriptions
- `customer.subscription.updated`: Update subscription status
- `customer.subscription.deleted`: Handle subscription cancellations
- `invoice.paid`: Process successful payments
- `invoice.payment_failed`: Handle failed payments

**Response**: HTTP 200 on success

## Error Handling

All API endpoints follow a consistent error handling pattern:

1. **Validation Errors**: 400 Bad Request with details about the validation failure
2. **Authentication Errors**: 401 Unauthorized for missing or invalid authentication
3. **Authorization Errors**: 403 Forbidden for insufficient permissions
4. **Resource Errors**: 404 Not Found for missing resources
5. **Server Errors**: 500 Internal Server Error for unexpected failures

```typescript
// Standard error response format
{
  error: true,
  message: string,  // Human-readable error message
  code?: string,    // Optional error code for client-side handling
  details?: any     // Optional additional error details
}
```

## Security Considerations

1. **Authentication**: Most endpoints require authenticated sessions
2. **CSRF Protection**: Implemented via Next.js built-in mechanisms
3. **Rate Limiting**: Consider implementing to prevent abuse
4. **Input Validation**: All incoming data is validated before processing
5. **Webhook Signatures**: Stripe webhooks verify signature to prevent forgery

## Adding New Endpoints

When extending the API:

1. Create new files in the appropriate directory under `/app/api`
2. Follow the pattern of existing endpoints
3. Implement proper validation and error handling
4. Document the new endpoint in this guide
5. Add appropriate tests
