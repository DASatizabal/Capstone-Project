# FeNAgO Authentication System

## Overview

FeNAgO uses NextAuth.js to provide a robust authentication system with multiple authentication methods. This document outlines the authentication architecture, configuration, and implementation details.

## Authentication Methods

### 1. OAuth Providers

**Google Authentication**: Allows users to sign in with their Google accounts

**Configuration**: Set up in `libs/next-auth.ts` with credentials from Google Developer Console

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_ID as string,
  clientSecret: process.env.GOOGLE_SECRET as string,
})
```

### 2. Magic Links (Email)

Allows users to sign in by receiving a one-time link to their email address

**Implementation**: Uses NodeMailer/Resend for email delivery

**Configuration**: Set up in `libs/next-auth.ts` and uses `libs/resend.ts` for email sending

## Authentication Flow

### Sign-In Process

1. User clicks on sign-in button (`ButtonSignin.tsx`)
2. NextAuth.js sign-in modal or page is presented
3. User chooses authentication method
4. Upon successful authentication:
   - If new user: User record is created in database
   - If existing user: User record is retrieved
5. Session is created and stored
6. User is redirected to the configured callback URL (typically dashboard)

### Session Management

- **Session Strategy**: Uses JWT for stateless session management
- **Session Duration**: Configured in `libs/next-auth.ts`
- **Session Refresh**: Automatic refresh of session tokens

## Implementation Files

### `/libs/next-auth.ts`

Core configuration file for NextAuth.js:

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider(...),
    EmailProvider(...),
  ],
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  callbacks: {
    session: async ({ session, token }) => {
      // Customize session object
      return session;
    },
    jwt: async ({ token, user }) => {
      // Customize JWT token
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    // Other custom pages
  },
  // Other NextAuth.js options
};
```

### `/app/api/auth/[...nextauth]/route.ts`

Handler for NextAuth.js API routes:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/libs/next-auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### `/components/ButtonSignin.tsx`

UI component for triggering the sign-in process:

```typescript
import { signIn, signOut, useSession } from "next-auth/react";

// Component implementation that handles sign-in/sign-out actions
```

## Protected Routes

Routes that require authentication, like the dashboard, are protected using session checks:

```typescript
// In /app/dashboard/layout.tsx or similar
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/api/auth/signin");
  }
  
  return <>{children}</>;
}
```

## User Data Storage

- **Database**: MongoDB via Mongoose
- **User Model**: Defined in `/models/User.ts`
- **Adapter**: MongoDBAdapter connects NextAuth.js to MongoDB

## Session Retrieval in Components

### Server Components

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";

export default async function ServerComponent() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    // User is authenticated
    return <div>Hello, {session.user.name}</div>;
  }
  
  // User is not authenticated
  return <div>Please sign in</div>;
}
```

### Client Components

```typescript
"use client";

import { useSession } from "next-auth/react";

export default function ClientComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  
  if (status === "authenticated") {
    // User is authenticated
    return <div>Hello, {session.user.name}</div>;
  }
  
  // User is not authenticated
  return <div>Please sign in</div>;
}
```

## Security Considerations

1. **CSRF Protection**: Built into NextAuth.js
2. **Secrets**: Store NEXTAUTH_SECRET securely in environment variables
3. **OAuth Security**: Configure proper redirect URIs
4. **Session Security**: JWT strategy with appropriate expiration
5. **Email Security**: Verify email delivery configuration

## Extending the Authentication System

### Adding New OAuth Providers

1. Register application with the provider (e.g., GitHub, Facebook)
2. Add provider credentials to environment variables
3. Add provider to NextAuth.js configuration:

```typescript
import GitHubProvider from "next-auth/providers/github";

// In authOptions.providers array
GitHubProvider({
  clientId: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
})
```

### Custom Authentication Logic

Implement custom logic in the NextAuth.js callbacks:

```typescript
callbacks: {
  async signIn({ user, account, profile, email, credentials }) {
    // Custom sign-in logic
    return true; // Allow sign-in
  },
  async redirect({ url, baseUrl }) {
    // Custom redirect logic
    return baseUrl;
  },
  // Other callbacks
}
```

## Planned Enhancements for Agentic Features

1. **Role-Based Access Control**:
   - Implement roles (user, admin, agent creator)
   - Add permission checks to protected resources

2. **API Key Authentication**:
   - Generate and validate API keys for headless use
   - Implement token-based usage tracking

3. **Agent-Specific Authentication**:
   - Create agent access tokens
   - Implement agent delegation permissions
