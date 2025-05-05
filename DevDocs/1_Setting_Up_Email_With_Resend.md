# Setting Up Email with Resend in Next.js

## Introduction

Email functionality is essential for many applications, from sending welcome messages to password reset links. This guide will walk you through setting up Resend (a modern email API) with your Next.js application.

## Prerequisites

- A Next.js application
- Node.js 14.x or later
- npm or yarn
[https://drlee.io/send-emails-like-a-pro-with-resend-and-next-js-no-headaches-just-results-7b77cf12cae6](https://drlee.io/send-emails-like-a-pro-with-resend-and-next-js-no-headaches-just-results-7b77cf12cae6)

## Step 1: Sign Up for a Free Resend Account

1. Go to [resend.com](https://resend.com) and click "Get Started".
2. Sign up using your GitHub account (strongly recommended) or email.
3. Verify your account if needed.

## Step 2: Get Your API Key

1. In the Resend dashboard, click on **API Keys** in the left-hand menu.
2. Click **Create API Key**.
3. Name your key (e.g., "NextJS Dev Key").
4. Copy the generated API key immediately (you won't be able to see it again).
5. Store this key in your `.env` file under `RESEND_API_KEY`.

⚠️ **Security Warning**: Never expose this key in client-side code. It should only be used in server-side functions.

## Step 3: Install Resend SDK

In your Next.js project, install the Resend SDK:

```bash
npm install resend
# or with yarn
yarn add resend
```

## Step 4: Create an Email Service

Create a utility file to handle email functionality. Let's make a file at `libs/resend.ts`:

```typescript
import { Resend } from 'resend';
import config from '@/config';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Centralized email service
export const emailService = {
  /**
   * Send a welcome email to a new user
   */
  sendWelcomeEmail: async (to: string, name: string) => {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: [to],
        subject: `Welcome to ${config.appName}!`,
        html: `
          <h1>Welcome to ${config.appName}, ${name}!</h1>
          <p>We're excited to have you on board.</p>
          <p>If you have any questions, feel free to reply to this email.</p>
        `,
      });
      
      if (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Send a password reset email
   */
  sendPasswordResetEmail: async (to: string, resetLink: string) => {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: [to],
        subject: `Reset your ${config.appName} password`,
        html: `
          <h1>Reset Your Password</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; background-color: #0070f3; color: white; font-weight: bold; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      });
      
      if (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Send a notification email
   */
  sendNotificationEmail: async (to: string, subject: string, message: string) => {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromAdmin,
        to: [to],
        subject,
        html: `
          <h2>${subject}</h2>
          <div>${message}</div>
        `,
      });
      
      if (error) {
        console.error('Error sending notification email:', error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return { success: false, error };
    }
  },
};
```

## Step 5: Using the Email Service in API Routes

Here's how to use your email service in a Next.js API route. For example, create a file at `app/api/welcome-email/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { emailService } from '@/libs/resend';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    const result = await emailService.sendWelcomeEmail(email, name);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error) {
    console.error('Welcome email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Step 6: Creating Email Templates with React

For more complex emails, you can create React components as templates. First, install the necessary package:

```bash
npm install @react-email/components
# or with yarn
yarn add @react-email/components
```

Create a templates directory in your project (`components/emails/`):

```typescript
// components/emails/WelcomeEmail.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { render } from '@react-email/render';

interface WelcomeEmailProps {
  name: string;
  appName: string;
  dashboardUrl: string;
}

export const WelcomeEmail = ({ name, appName, dashboardUrl }: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {appName}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Img
            src="https://yourdomain.com/logo.png"
            alt={`${appName} Logo`}
            width="120"
            height="50"
          />
          <Heading style={headingStyle}>Welcome to {appName}!</Heading>
          <Text style={textStyle}>
            Hi {name},
          </Text>
          <Text style={textStyle}>
            We're thrilled to have you join us. Your account has been successfully
            created and you're ready to get started.
          </Text>
          <Section style={buttonContainerStyle}>
            <Link
              style={buttonStyle}
              href={dashboardUrl}
            >
              Go to Dashboard
            </Link>
          </Section>
          <Text style={textStyle}>
            If you have any questions, simply reply to this email. We're always here to help.
          </Text>
          <Text style={textStyle}>
            Best regards,<br />
            The {appName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// You can export a function to render the email to HTML
export function renderWelcomeEmail(props: WelcomeEmailProps) {
  return render(<WelcomeEmail {...props} />);
}

// Styles
const bodyStyle = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const headingStyle = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '15px',
};

const textStyle = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '10px',
};

const buttonContainerStyle = {
  margin: '20px 0',
  textAlign: 'center' as const,
};

const buttonStyle = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 30px',
  textDecoration: 'none',
};
```

Then update your email service to use this template:

```typescript
// In your libs/resend.ts
import { renderWelcomeEmail } from '@/components/emails/WelcomeEmail';

// Inside emailService
sendWelcomeEmail: async (to: string, name: string) => {
  try {
    const html = renderWelcomeEmail({
      name,
      appName: config.appName,
      dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
    });
    
    const { data, error } = await resend.emails.send({
      from: config.resend.fromNoReply,
      to: [to],
      subject: `Welcome to ${config.appName}!`,
      html,
    });
    
    // Rest of the function...
  }
}
```

## Step 7: Testing Your Email Setup

Create a test route to verify your email setup is working correctly:

```typescript
// app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { emailService } from '@/libs/resend';

// Only enable this endpoint in development
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 404 });
  }
  
  const testEmail = 'your-test-email@example.com';
  
  try {
    const result = await emailService.sendWelcomeEmail(
      testEmail,
      'Test User'
    );
    
    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

Visit `/api/test-email` in your browser during development to trigger a test email.

## Step 8: Verifying a Domain (For Production)

Before going to production, you should verify your domain with Resend:

1. In the Resend dashboard, go to **Domains** and click **Add Domain**
2. Enter your domain name (e.g., `yourdomain.com`)
3. Follow the DNS verification steps provided by Resend
4. After verification, update your config to use your domain:

```typescript
// In config.ts
resend: {
  fromNoReply: `FeNAgO <noreply@yourdomain.com>`,
  fromAdmin: `Support Team <support@yourdomain.com>`,
  supportEmail: "support@yourdomain.com",
},
```

## Best Practices

1. **Error Handling**: Always implement proper error handling for email operations
2. **Logging**: Log email successes and failures for troubleshooting
3. **Rate Limiting**: Implement rate limiting for endpoints that trigger emails
4. **Email Templating**: Use a design system for consistent email templates
5. **Testing**: Test emails across different email clients
6. **Environment Variables**: Keep your API keys in environment variables
7. **DKIM/SPF**: Ensure proper email authentication to improve deliverability

## Common Email Use Cases

- Welcome emails for new users
- Password reset links
- Email verification
- Order confirmations
- Notification emails
- Newsletter distribution
- Product updates
- Security alerts

## Troubleshooting

1. **Emails not sending**: Verify your API key is correct and not expired
2. **Emails going to spam**: Complete domain verification and set up proper SPF/DKIM
3. **Rendering issues**: Test your email templates in multiple clients using Resend's preview feature
4. **Rate limiting**: Check if you're hitting Resend's rate limits

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email](https://react.email/)
- [MJML](https://mjml.io/) - For responsive email templates
- [Email Testing Tools](https://www.emailonacid.com/)
