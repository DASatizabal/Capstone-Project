# Authentication Flow Diagram

This diagram illustrates the authentication process in the FeNAgO platform, showing the flow for both OAuth and Magic Link authentication methods.

```mermaid
sequenceDiagram
    actor User
    participant UI as FeNAgO UI
    participant Auth as NextAuth.js
    participant OAuth as OAuth Provider
    participant Email as Email Service
    participant DB as Database
    
    User->>UI: Click Sign In
    UI->>Auth: Initiate Auth Flow
    
    alt OAuth Authentication
        Auth->>OAuth: Redirect to Provider
        User->>OAuth: Enter Credentials
        OAuth->>Auth: Return with Auth Token
        Auth->>DB: Verify/Create User
        Auth->>UI: Create Session
        UI->>User: Redirect to Dashboard
    else Magic Link Authentication
        Auth->>UI: Show Email Input Form
        User->>UI: Enter Email Address
        UI->>Auth: Submit Email
        Auth->>DB: Check if User Exists
        Auth->>Email: Send Magic Link
        Email-->>User: Receive Email with Link
        User->>Auth: Click Magic Link
        Auth->>DB: Verify Token
        Auth->>UI: Create Session
        UI->>User: Redirect to Dashboard
    end
    
    Note over User,DB: Session is maintained with JWT
```

This diagram illustrates:

1. Two authentication paths: OAuth and Magic Link
2. The interaction between the user and various system components
3. The creation and verification of user accounts
4. Session establishment after successful authentication
