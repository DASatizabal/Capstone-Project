# FeNAgO Database Models

## Overview

FeNAgO uses MongoDB as its database, interfaced through Mongoose ODM (Object-Document Mapper). This document outlines the database models and their relationships.

## Database Connection

The database connection is managed in two files:

1. `libs/mongo.ts` - Handles the direct MongoDB client connection (used by NextAuth)
2. `libs/mongoose.ts` - Configures Mongoose and establishes connection pooling

## Core Models

### User Model

**File**: `/models/User.ts`

**Purpose**: Stores user information and authentication details

**Schema**:
```typescript
interface UserDocument extends Document {
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  stripePriceId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  features?: {
    [key: string]: any;
  };
}
```

**Key Fields**:
- `email`: User's email address (primary identifier)
- `name`: User's display name
- `emailVerified`: Timestamp of email verification
- `image`: User's profile image URL
- `stripePriceId`: Currently subscribed Stripe price ID
- `stripeCustomerId`: Stripe customer ID for payment processing
- `stripeSubscriptionId`: Stripe subscription ID if subscribed
- `stripeSubscriptionStatus`: Current subscription status
- `features`: Object containing feature flags or user-specific configuration

### Lead Model

**File**: `/models/Lead.ts`

**Purpose**: Stores potential customer information captured from forms

**Schema**:
```typescript
interface LeadDocument extends Document {
  email: string;
  name?: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Fields**:
- `email`: Lead's email address
- `name`: Lead's name (optional)
- `source`: Where the lead came from (e.g., "landing-page", "blog")
- `createdAt`: Timestamp of lead creation
- `updatedAt`: Timestamp of lead information update

## Planned Agentic Models

These models will need to be implemented to support the agentic features of FeNAgO:

### Agent Model

**File**: To be created at `/models/Agent.ts`

**Purpose**: Stores agent configuration and state

**Proposed Schema**:
```typescript
interface AgentDocument extends Document {
  name: string;
  description: string;
  ownerId: string; // References User
  configuration: {
    model: string;
    temperature: number;
    systemPrompt: string;
    maxTokens: number;
    tools: string[];
    // Other configuration parameters
  };
  isPublic: boolean;
  status: 'active' | 'paused' | 'archived';
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Conversation Model

**File**: To be created at `/models/Conversation.ts`

**Purpose**: Stores conversation history between users and agents

**Proposed Schema**:
```typescript
interface ConversationDocument extends Document {
  title: string;
  userId: string; // References User
  agentId: string; // References Agent
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: any;
  }[];
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

### AgentExecution Model

**File**: To be created at `/models/AgentExecution.ts`

**Purpose**: Tracks agent execution metrics and logs

**Proposed Schema**:
```typescript
interface AgentExecutionDocument extends Document {
  agentId: string; // References Agent
  conversationId: string; // References Conversation
  userId: string; // References User
  tokensUsed: number;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  error?: string;
  logs: {
    timestamp: Date;
    type: 'info' | 'warning' | 'error';
    message: string;
    metadata?: any;
  }[];
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}
```

## Mongoose Plugins

The application uses Mongoose plugins to extend model functionality:

- **Timestamps**: Automatically adds and manages `createdAt` and `updatedAt` fields

## Database Indexes

To optimize query performance, consider adding the following indexes:

1. `User.email`: Unique index for quick user lookup
2. `Lead.email`: Index for lead email searches
3. `Agent.ownerId`: For quick lookup of a user's agents
4. `Conversation.userId` and `Conversation.agentId`: For filtering conversations

## Data Relationships

- **User to Agent**: One-to-many (a user can own multiple agents)
- **User to Conversation**: One-to-many (a user can have multiple conversations)
- **Agent to Conversation**: One-to-many (an agent can participate in multiple conversations)
- **Agent to AgentExecution**: One-to-many (an agent can have multiple execution records)

## Scalability Considerations

1. **Sharding**: For large-scale deployments, consider implementing MongoDB sharding by userId
2. **Document Size**: Monitor conversation documents as they can grow large over time
3. **Aggregation**: Implement efficient aggregation pipelines for analytics
4. **Archiving**: Create a strategy for archiving old conversations and execution logs
