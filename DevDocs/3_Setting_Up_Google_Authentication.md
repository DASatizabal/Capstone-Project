# Setting Up Google Authentication in Next.js

## Introduction

Google OAuth 2.0 provides a secure and user-friendly authentication method for web applications. By implementing Google authentication in your Next.js application, you can offer users a streamlined login experience using their existing Google accounts. This guide will walk you through the process of setting up Google authentication using NextAuth.js.

## Why Use Google Authentication?

- **Security**: Leverages Google's robust security infrastructure
- **User Experience**: Simplifies sign-up and login processes
- **Reduced Development Time**: Less code to write and maintain compared to custom auth systems
- **Trust**: Users are often more comfortable using existing credentials than creating new accounts

## Prerequisites

- A Next.js application
- Node.js 14.x or later
- npm or yarn
- A Google account

## Step 1: Create a New Project on Google Cloud

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown near the top of the page
3. Click on "New Project"
4. Enter a project name (e.g., "MyNextJSApp")
5. Click "Create"
6. Wait for the project to be created and then select it

## Step 2: Configure OAuth Consent Screen

1. In the left sidebar, navigate to "APIs & Services" > "OAuth consent screen"
2. Select the appropriate user type:
   - **External**: For general use (starts in testing mode, limited to 100 users)
   - **Internal**: For organizational use (if you have a Google Workspace account)
3. Click "Create"
4. Fill in the required application information:
   - App name
   - User support email
   - Developer contact information
5. Click "Save and Continue"
6. For Scopes, add the following:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
7. Click "Save and Continue"
8. Under Test users, add your email and any other test users
9. Click "Save and Continue"
10. Review your settings and click "Back to Dashboard"

## Step 3: Create OAuth Client ID Credentials

1. In the left sidebar, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "OAuth client ID"
3. For Application type, select "Web application"
4. Name your OAuth 2.0 client (e.g., "NextJS Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000` (for development)
   - `https://your-production-domain.com` (for production, if applicable)
6. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-production-domain.com/api/auth/callback/google` (for production, if applicable)
7. Click "Create"
8. A modal will appear with your client ID and client secret
9. Copy both values and store them securely

## Step 4: Set Up Environment Variables

1. In your Next.js project root, create or edit your `.env` file
2. Add the following lines, replacing with your actual credentials:

```
GOOGLE_ID=your-client-id
GOOGLE_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

For production, update `NEXTAUTH_URL` to your production domain.

Generate a secure random string for `NEXTAUTH_SECRET` using:
```bash
openssl rand -base64 32
```

## Step 5: Install NextAuth.js

```bash
npm install next-auth
# or
yarn add next-auth
```

## Step 6: Create NextAuth API Route

Create a file at `app/api/auth/[...nextauth]/route.ts` with the following content:

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    // You can define custom pages for error, verification, etc.
  },
  callbacks: {
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Add user ID to token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST };
```

## Step 7: Create Authentication Components

Create a sign-in button component at `components/SignInButton.tsx`:

```typescript
"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function SignInButton() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <p>Hello, {session.user?.name}!</p>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 px-4 py-2 rounded-md bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
          <path
            fill="#4285F4"
            d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
          />
          <path
            fill="#34A853"
            d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
          />
          <path
            fill="#FBBC05"
            d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
          />
          <path
            fill="#EA4335"
            d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
          />
        </g>
      </svg>
      Sign in with Google
    </button>
  );
}
```

## Step 8: Set Up NextAuth Provider

Create or update your root layout file at `app/layout.tsx` to include the NextAuth provider:

```typescript
import { NextAuthProvider } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
```

Create a providers file at `app/providers.tsx`:

```typescript
"use client";

import { SessionProvider } from "next-auth/react";

type Props = {
  children?: React.ReactNode;
};

export const NextAuthProvider = ({ children }: Props) => {
  return <SessionProvider>{children}</SessionProvider>;
};
```

## Step 9: Implement Protected Routes

To create protected routes that require authentication, you can use a middleware or check the session in server components:

### For Server Components:

```typescript
// app/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user?.name}!</p>
    </div>
  );
}
```

### For Client Components:

```typescript
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {session?.user?.email}</p>
    </div>
  );
}
```

## Testing Your Implementation

1. Start your Next.js development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Navigate to your application (e.g., http://localhost:3000)

3. Click the "Sign in with Google" button

4. You should be redirected to Google's authentication page

5. After signing in, you'll be redirected back to your application

## Troubleshooting

### Common Issues:

1. **Redirect URI Mismatch**: Ensure the callback URL registered in Google Cloud matches exactly with your application's callback URL.

2. **CORS Errors**: Check that your authorized JavaScript origins are correctly set up.

3. **Invalid Client Secret**: Verify that the client ID and secret are correctly copied into your environment variables.

4. **Session Not Persisting**: Ensure `NEXTAUTH_SECRET` is properly set in your environment variables.

5. **Google API Not Enabled**: Make sure you've enabled the Google+ API in your Google Cloud Console.

## Advanced Configuration

### Custom Sign-In Page

Create a custom sign-in page at `app/auth/signin/page.tsx`:

```typescript
"use client";

import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <h2 className="text-center text-3xl font-bold tracking-tight">Sign in</h2>
        <div className="mt-8">
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex w-full justify-center items-center gap-3 rounded-md bg-white px-4 py-3 text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path
                  fill="#4285F4"
                  d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                />
                <path
                  fill="#34A853"
                  d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                />
                <path
                  fill="#FBBC05"
                  d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                />
                <path
                  fill="#EA4335"
                  d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                />
              </g>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Adding Additional Providers

NextAuth.js supports many authentication providers. You can add them alongside Google:

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  // Rest of your configuration
});

export { handler as GET, handler as POST };
```

## Security Considerations

- **Environment Variables**: Never expose client secrets in client-side code
- **Session Security**: Use a strong NEXTAUTH_SECRET
- **Scope Minimization**: Only request the Google scopes you need
- **Regular Audits**: Periodically review Google Cloud Console settings

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [How to Setup Google Authentication Step by Step](https://drlee.io/how-to-setup-google-authentication-step-by-step-3707d0dffc77)
- [Google Identity Services Documentation](https://developers.google.com/identity)

---

By following this guide, you should have a fully functional Google authentication system integrated into your Next.js application. This provides a secure and user-friendly way for users to sign in to your application using their Google accounts.
