# FeNAgO — Next.js Agentic SaaS Boilerplate

## Overview

FeNAgO is a comprehensive Next.js boilerplate for building agentic SaaS applications. It provides a solid foundation with essential integrations and features to help you launch your AI-powered SaaS quickly.

## Features

- **Next.js App Router**: Modern React framework with server components
- **Authentication**: Multiple auth options including Google OAuth and Magic Links
- **Database Integration**: MongoDB Atlas for data persistence
- **Email Functionality**: Integrated with Resend for transactional emails
- **Payment Processing**: Stripe integration for subscriptions and payments
- **SEO Optimization**: Built-in SEO tools and best practices
- **Analytics**: User behavior tracking and conversion analysis

## Documentation

### Setup Guides

Comprehensive documentation is available in the `/DevDocs` directory:

1. [UI Components Guide](./DevDocs/0_UI_Components_Guide.md)
   - Overview of component framework, UI libraries, and resources
   - Guide to finding and using DaisyUI, Tailwind, and other components

2. [Setting Up Email With Resend](./DevDocs/1_Setting_Up_Email_With_Resend.md)
   - Account creation and API key setup
   - Configuring email templates
   - Sending transactional emails

3. [Setting Up MongoDB Atlas](./DevDocs/2_Setting_Up_MongoDB_Atlas.md)
   - Creating a free MongoDB Atlas account
   - Database setup and connection
   - Security configuration

4. [Setting Up Google Authentication](./DevDocs/3_Setting_Up_Google_Authentication.md)
   - Google Cloud Console configuration
   - OAuth consent screen setup
   - NextAuth.js integration

5. [Setting Up Magic Links Authentication](./DevDocs/4_Setting_Up_Magic_Links_Authentication.md)
   - Passwordless authentication flow
   - Email template customization
   - NextAuth.js configuration

6. [Setting Up Stripe Payments](./DevDocs/5_Setting_Up_Stripe_Payments.md)
   - Stripe account creation and configuration
   - Product and subscription setup
   - Webhook integration

7. [Setting Up SEO Features](./DevDocs/6_Setting_Up_SEO_Features.md)
   - Metadata configuration
   - Structured data implementation
   - Sitemap generation

8. [Setting Up Analytics With DataFast](./DevDocs/7_Setting_Up_Analytics_With_DataFast.md)
   - Analytics integration
   - Event tracking
   - Conversion monitoring

### Development Plans

Detailed development plans are available in the `/DevPlanDocs` directory:

1. [Architecture Overview](./DevPlanDocs/1-Architecture-Overview.md)
   - System components and interactions
   - Technical stack details

2. [Components Overview](./DevPlanDocs/2-Components-Overview.md)
   - UI component structure
   - Component relationships

3. [Development Plan](./DevPlanDocs/3-Development-Plan.md)
   - Phase-by-phase implementation strategy
   - Milestone definitions

4. [API Endpoints](./DevPlanDocs/4-API-Endpoints.md)
   - API routes and configurations
   - Request/response formats

5. [Database Models](./DevPlanDocs/5-Database-Models.md)
   - Data schema design
   - Relationships between models

6. [Authentication System](./DevPlanDocs/6-Authentication-System.md)
   - Auth flow details
   - Session management

7. [Payment Integration](./DevPlanDocs/7-Payment-Integration.md)
   - Stripe checkout process
   - Subscription management

8. [Rebranding Strategy](./DevPlanDocs/8-Rebranding-Strategy.md)
   - Guidelines for customizing the application
   - Branding element replacement

### Architecture Diagrams

- [System Architecture](./DevPlanDocs/mermaid-system-architecture.md)
- [Authentication Flow](./DevPlanDocs/mermaid-authentication-flow.md)
- [Payment & Subscription Flow](./DevPlanDocs/mermaid-payment-subscription-flow.md)
- [Database Schema](./DevPlanDocs/mermaid-database-schema.md)
- [Agent Lifecycle](./DevPlanDocs/mermaid-agent-lifecycle.md)
- [Development Roadmap](./DevPlanDocs/mermaid-development-roadmap.md)

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install` or `yarn`
3. Set up your environment variables following the documentation
4. Run the development server with `npm run dev` or `yarn dev`

## Environment Setup

Copy the `.env.sample` file to `.env.local` and fill in the required variables:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Authentication
GOOGLE_ID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret

# Payments (Stripe)
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.