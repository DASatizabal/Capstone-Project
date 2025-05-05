# FeNAgO Architecture Overview

## Project Structure

The FeNAgO project (forked from ShipFast) is a Next.js-based SaaS starter kit with the following directory structure:

```
/
├── app/                    # Next.js app directory (App Router)
│   ├── api/                # API routes (serverless functions)
│   │   ├── auth/           # Authentication endpoints
│   │   ├── lead/           # Lead generation endpoints
│   │   ├── stripe/         # Stripe payment endpoints
│   │   └── webhook/        # Webhook handlers (like Stripe webhooks)
│   ├── blog/               # Blog pages
│   ├── dashboard/          # User dashboard (protected area)
│   ├── privacy-policy/     # Privacy policy page
│   ├── tos/                # Terms of service page
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Homepage
├── components/             # Reusable React components
├── DevDocs/                # Developer documentation
├── DevPlanDocs/            # Development planning documents
├── libs/                   # Utility libraries
│   ├── api.ts              # API client utilities
│   ├── gpt.ts              # GPT integration utilities
│   ├── mongo.ts            # MongoDB connection
│   ├── mongoose.ts         # Mongoose configuration
│   ├── next-auth.ts        # NextAuth.js configuration
│   ├── resend.ts           # Email service configuration
│   ├── seo.tsx             # SEO utilities
│   └── stripe.ts           # Stripe integration
├── models/                 # Database models
│   ├── Lead.ts             # Lead database model
│   ├── User.ts             # User database model
│   └── plugins/            # Mongoose plugins
├── public/                 # Static assets
└── types/                  # TypeScript type definitions
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with DaisyUI components
- **State Management**: React Context + Hooks
- **Components**: Mixture of custom and DaisyUI components

### Backend
- **API Routes**: Next.js serverless API routes
- **Authentication**: NextAuth.js with support for OAuth (Google) and magic links
- **Database**: MongoDB with Mongoose ODM
- **Payment Processing**: Stripe integration
- **Email**: Resend for transactional emails

### DevOps
- **Deployment**: Ready for Vercel, Netlify, or similar platforms
- **Environment Variables**: Environment configuration via .env files

## Key Architectural Patterns

### Authentication Flow

The application uses NextAuth.js for authentication, supporting both OAuth providers (Google) and magic link email authentication. Authentication state is managed through sessions and is accessible throughout the application.

### Data Flow

1. **Client-Side**: API requests are made through the `api.ts` utility which handles authentication and error states
2. **Server-Side**: API routes in the `/app/api` directory process requests, interact with the database, and return responses
3. **Database**: MongoDB with Mongoose models defined in the `/models` directory

### Component Architecture

The UI is composed of reusable components in the `/components` directory, following a composition pattern. Component organization is flat with semantic naming (e.g., `Button*.tsx`, `Hero.tsx`, etc.).

### Payment Integration

Stripe is integrated for payment processing with:  
- Client-side checkout components  
- Server-side webhook handling  
- Product/plan configuration in `config.ts`  

### Configuration

The global application configuration is centralized in `config.ts`, making it easy to customize branding, pricing, and feature flags.

## Deployment Architecture

The application is designed to be deployed as a monolithic application on platforms like Vercel or Netlify. It leverages serverless functions for API routes and has the following external dependencies:  

- MongoDB Atlas for database  
- Stripe for payments  
- Resend for emails  
- OAuth providers (e.g., Google)  

## Security Considerations

- Authentication through NextAuth.js with secure session management
- Environment variables for sensitive credentials
- Server-side validation of user inputs
- CSRF protection through Next.js built-in mechanisms
- Webhook signature verification for Stripe events
