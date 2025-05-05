# System Architecture Diagram

This diagram illustrates the high-level architecture of the FeNAgO platform, showing how the different components interact.

```mermaid
flowchart TD
    subgraph "Frontend"
        UI["Next.js UI Components"] --> Router["Next.js App Router"] 
        Router --> PageComponents["Page Components"]
        Router --> ServerComponents["Server Components"] 
        UI --> ClientComponents["Client Components"]
    end

    subgraph "Backend Services"
        API["Next.js API Routes"] --> Auth["Authentication"] 
        API --> PaymentAPI["Payment Processing"]
        API --> AgentAPI["Agent Management"]
        API --> WebhookHandlers["Webhook Handlers"]
        ServerComponents --> API
    end

    subgraph "External Services"
        Auth --> NextAuth["NextAuth.js"]
        NextAuth --> OAuth["OAuth Providers"]
        NextAuth --> MagicLink["Magic Links"]
        PaymentAPI --> Stripe["Stripe"]
        AgentAPI --> OpenAI["OpenAI / AI Providers"]
        Email["Email Service (Resend)"]
        MagicLink --> Email
    end

    subgraph "Database"
        Mongoose["Mongoose ODM"] --> MongoDB["MongoDB"]
        MongoDB --> UserCollection["Users"]
        MongoDB --> AgentCollection["Agents"]
        MongoDB --> ConversationCollection["Conversations"]
        MongoDB --> ExecutionCollection["Agent Executions"]
    end

    API --> Mongoose
    ClientComponents --> API
    WebhookHandlers --> Stripe

    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#bbf,stroke:#333,stroke-width:2px
    style Database fill:#bfb,stroke:#333,stroke-width:2px
    style External fill:#fbb,stroke:#333,stroke-width:2px
```

This diagram shows:

1. The frontend components and their interactions
2. The backend API routes and services
3. External service integrations (OAuth, Stripe, OpenAI)
4. Database structure and collections
5. The flow of data between these components
