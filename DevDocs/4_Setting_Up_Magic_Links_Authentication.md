# Setting Up Magic Links Authentication in Next.js

## Introduction

Magic links provide a passwordless authentication method where users receive a login link via email. This approach enhances security by eliminating password-related vulnerabilities and improves user experience by removing the need to remember credentials. This guide will show you how to implement magic link authentication in your Next.js application using NextAuth.js, Resend for email delivery, and MongoDB for user storage.

## Prerequisites

- A Next.js application
- Resend account set up for email delivery (see [1_Setting_Up_Email_With_Resend.md](./1_Setting_Up_Email_With_Resend.md))
- MongoDB database configured (see [2_Setting_Up_MongoDB_Atlas.md](./2_Setting_Up_MongoDB_Atlas.md))
- NextAuth.js installed in your project

## Step 1: Environment Configuration

1. Create or update your `.env` file with the following variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_strong_secret_key_at_least_15_chars
RESEND_API_KEY=your_resend_api_key
MONGODB_URI=your_mongodb_connection_string
```

### About These Environment Variables

- `NEXTAUTH_URL`: The base URL of your application
- `NEXTAUTH_SECRET`: A random string used to encrypt tokens and sign cookies (use at least 15 characters)
- `RESEND_API_KEY`: Your Resend API key for sending emails
- `MONGODB_URI`: Your MongoDB connection string

You can generate a secure random string for `NEXTAUTH_SECRET` using this command:

```bash
openssl rand -base64 32
```

## Step 2: Update the config.ts File

Ensure your `config.ts` file includes the proper email configuration for Resend:

```typescript
// In config.ts
resend: {
  // Email 'From' field for magic login links
  fromNoReply: `FeNAgO <noreply@resend.fenago.com>`,
  // Email 'From' field for other communications
  fromAdmin: `Dr Lee at FeNAgO <drlee@resend.fenago.com>`,
  // Support email address
  supportEmail: "support@fenago.com",
},
```

## Step 3: Install Required Packages

Ensure you have all necessary packages installed:

```bash
npm install next-auth @auth/mongodb-adapter mongodb resend
# or
yarn add next-auth @auth/mongodb-adapter mongodb resend
```

## Step 4: Set Up MongoDB Adapter

Create a MongoDB client connection file at `libs/mongo.ts`:

```typescript
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
```

## Step 5: Configure NextAuth with Email Provider

Create or update the NextAuth configuration at `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/libs/mongo";
import { Resend } from "resend";
import config from "@/config";

// Initialize Resend for email sending
const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    EmailProvider({
      server: {
        // No SMTP server needed with Resend
      },
      from: config.resend.fromNoReply,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        try {
          const { data, error } = await resend.emails.send({
            from: provider.from,
            to: [identifier],
            subject: `Sign in to ${config.appName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Sign in to ${config.appName}</h2>
                <p>Click the link below to sign in to your account:</p>
                <div style="margin: 30px 0;">
                  <a href="${url}" style="background: #4F46E5; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                    Sign in
                  </a>
                </div>
                <p>If you didn't request this email, you can safely ignore it.</p>
                <p>This link will expire in 24 hours and can only be used once.</p>
              </div>
            `,
          });

          if (error) {
            throw new Error(`Error sending email: ${error.message}`);
          }

          console.log("Verification email sent", data);
        } catch (error) {
          console.error("Error sending verification email", error);
          throw new Error("Error sending verification email");
        }
      },
    }),
    // You can add other providers here (Google, GitHub, etc.)
  ],
  pages: {
    signIn: "/auth/signin", // Custom sign-in page
    verifyRequest: "/auth/verify-request", // Page displayed after email is sent
    error: "/auth/error", // Error page
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      // Add user ID to session
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

## Step 6: Create Custom Authentication Pages

### Sign-In Page

Create a custom sign-in page at `app/auth/signin/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Redirect to verify-request page
      router.push("/auth/verify-request");
    } catch (e) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address to receive a magic link
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send magic link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Verification Request Page

Create a verification request page at `app/auth/verify-request/page.tsx`:

```tsx
export default function VerifyRequest() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md text-center">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
          Check your email
        </h2>
        <p className="mt-4 text-center text-gray-600">
          A sign in link has been sent to your email address. Please check your
          inbox and spam folder.
        </p>
        <p className="mt-2 text-center text-gray-600">
          The link will expire in 24 hours.
        </p>
      </div>
    </div>
  );
}
```

### Error Page

Create an error page at `app/auth/error/page.tsx`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have access to this resource.",
  Verification: "The token has expired or has already been used.",
  Default: "An unexpected error occurred.",
};

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md text-center">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-red-600">
          Authentication Error
        </h2>
        <p className="mt-4 text-center text-gray-600">{errorMessage}</p>
        <div className="mt-6">
          <Link
            href="/auth/signin"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
```

## Step 7: Create a Sign-In Button Component

Create a reusable sign-in button component at `components/SignInButton.tsx`:

```tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function SignInButton() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm">{session.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-md bg-gray-800 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth/signin"
      className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      Sign in
    </Link>
  );
}
```

## Step 8: Set Up NextAuth Provider

Create a provider file at `app/providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

type Props = {
  children?: React.ReactNode;
};

export const NextAuthProvider = ({ children }: Props) => {
  return <SessionProvider>{children}</SessionProvider>;
};
```

Then update your root layout at `app/layout.tsx`:

```tsx
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

## Step 9: Create Protected Routes

### Server Component Protection

For server components, use getServerSession to check authentication:

```tsx
// app/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, {session.user?.email}!</p>
      <p>You are successfully signed in with magic link authentication.</p>
    </div>
  );
}
```

### Client Component Protection

For client components, use the useSession hook:

```tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p>Email: {session.user?.email}</p>
    </div>
  );
}
```

## Step 10: Testing the Magic Link Authentication

1. Start your Next.js development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Navigate to your sign-in page (e.g., http://localhost:3000/auth/signin)

3. Enter your email address and click "Send magic link"

4. Check your email for the magic link

5. Click the link in the email to authenticate

6. You should be redirected to your application and authenticated

## Troubleshooting

### Common Issues

1. **Email Not Received**:
   - Check spam/junk folders
   - Verify Resend API key is correct
   - Ensure the from email address is properly configured
   - Check Resend dashboard for delivery status

2. **Database Connection Issues**:
   - Verify MongoDB connection string is correct
   - Ensure network access is properly configured in MongoDB Atlas

3. **Link Expiry or Invalid**:
   - Magic links expire after 24 hours by default
   - Links can only be used once
   - Check for proper URL encoding in the email template

4. **Session Not Persisting**:
   - Ensure `NEXTAUTH_SECRET` is properly set
   - Check cookie settings and cross-domain issues

## Advanced Customization

### Customizing Email Templates

You can customize the email template in the `sendVerificationRequest` function:

```typescript
sendVerificationRequest: async ({ identifier, url, provider }) => {
  // Create a more advanced HTML template
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <img src="https://yourdomain.com/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; max-width: 200px;">
      <h2 style="color: #111827; text-align: center; margin-bottom: 20px;">Sign in to ${config.appName}</h2>
      <p style="color: #4b5563; text-align: center;">Click the button below to sign in to your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background: #4F46E5; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Sign in
        </a>
      </div>
      <p style="color: #4b5563; text-align: center; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
      <p style="color: #4b5563; text-align: center; font-size: 14px;">This link will expire in 24 hours and can only be used once.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; text-align: center; font-size: 12px;">${config.appName} &copy; ${new Date().getFullYear()}</p>
    </div>
  `;

  await resend.emails.send({
    from: provider.from,
    to: [identifier],
    subject: `Sign in to ${config.appName}`,
    html,
  });
}
```

### Adjusting Token Expiration

You can customize the token expiration in the NextAuth configuration:

```typescript
export const authOptions = {
  // Other options...
  
  // Email token settings
  email: {
    maxAge: 60 * 60, // 1 hour (in seconds)
  },
  
  // Session settings
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
```

## Security Considerations

1. **Email Security**: Ensure your email provider (Resend) has proper SPF and DKIM records to prevent spoofing.

2. **Token Security**: Use a strong `NEXTAUTH_SECRET` to prevent token tampering.

3. **Rate Limiting**: Consider implementing rate limiting on the sign-in endpoint to prevent abuse.

4. **IP Logging**: For added security, log the IP address of sign-in attempts and successful authentications.

5. **Multiple Devices**: Be aware that users can be logged in from multiple devices with magic links.

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Resend Documentation](https://resend.com/docs)
- [MongoDB Adapter Documentation](https://authjs.dev/reference/adapter/mongodb)

---

By following this guide, you should have a fully functional magic link authentication system in your Next.js application. This passwordless approach offers a secure and user-friendly login experience without the hassle of password management.
