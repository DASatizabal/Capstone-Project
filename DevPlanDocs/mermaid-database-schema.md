# Database Schema Diagram

This diagram visualizes the database schema for the FeNAgO platform, showing the collections and their relationships.

```mermaid
erDiagram
    USER {
        string _id PK
        string email
        string name
        date emailVerified
        string image
        string stripeCustomerId
        string stripePriceId
        string stripeSubscriptionId
        string stripeSubscriptionStatus
        object features
        date createdAt
        date updatedAt
    }
    
    AGENT {
        string _id PK
        string name
        string description
        string ownerId FK
        object configuration
        boolean isPublic
        string status
        date lastActive
        date createdAt
        date updatedAt
    }
    
    CONVERSATION {
        string _id PK
        string title
        string userId FK
        string agentId FK
        array messages
        string status
        date createdAt
        date updatedAt
    }
    
    AGENT_EXECUTION {
        string _id PK
        string agentId FK
        string conversationId FK
        string userId FK
        number tokensUsed
        date startTime
        date endTime
        string status
        string error
        array logs
        object result
        date createdAt
        date updatedAt
    }
    
    LEAD {
        string _id PK
        string email
        string name
        string source
        date createdAt
        date updatedAt
    }
    
    USER ||--o{ AGENT : owns
    USER ||--o{ CONVERSATION : participates_in
    AGENT ||--o{ CONVERSATION : participates_in
    AGENT ||--o{ AGENT_EXECUTION : executes
    CONVERSATION ||--o{ AGENT_EXECUTION : tracks
    USER ||--o{ AGENT_EXECUTION : initiates
```

This diagram illustrates:

1. The core data models in the FeNAgO platform
2. The fields within each collection
3. The relationships between different collections
4. Primary keys (PK) and foreign keys (FK) showing connections
