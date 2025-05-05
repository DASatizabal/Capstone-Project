# Payment and Subscription Flow Diagram

This diagram visualizes the payment and subscription process within the FeNAgO platform, showing the interactions between the user, application, and Stripe.

```mermaid
sequenceDiagram
    actor User
    participant UI as FeNAgO UI
    participant API as FeNAgO API
    participant Stripe as Stripe API
    participant Webhook as Webhook Handler
    participant DB as Database
    
    User->>UI: Select Subscription Plan
    UI->>API: Request Checkout Session
    API->>Stripe: Create Checkout Session
    Stripe-->>API: Return Session ID & URL
    API-->>UI: Return Checkout URL
    UI->>User: Redirect to Stripe Checkout
    
    User->>Stripe: Complete Payment Information
    Stripe->>Stripe: Process Payment
    
    alt Payment Successful
        Stripe->>Webhook: Send checkout.session.completed Event
        Webhook->>DB: Update User Subscription Status
        Stripe->>User: Show Success Page
        Stripe->>UI: Redirect to Success URL
        UI->>User: Show Subscription Confirmation
    else Payment Failed
        Stripe->>User: Show Error Message
        Stripe->>UI: Redirect to Cancel URL
        UI->>User: Show Payment Failed Message
    end
    
    Note over User,DB: Subscription Management
    
    User->>UI: Navigate to Billing Settings
    UI->>API: Request Customer Portal URL
    API->>Stripe: Create Customer Portal Session
    Stripe-->>API: Return Portal URL
    API-->>UI: Return Portal URL
    UI->>User: Redirect to Stripe Customer Portal
    
    User->>Stripe: Modify Subscription
    Stripe->>Webhook: Send customer.subscription.updated Event
    Webhook->>DB: Update Subscription Details
    Stripe->>UI: Redirect Back to Application
    UI->>User: Show Updated Subscription Status
```

This diagram illustrates:

1. The initial subscription process from plan selection to payment
2. Webhook handling for successful and failed payments
3. The subscription management process through Stripe Customer Portal
4. Database updates reflecting subscription changes
