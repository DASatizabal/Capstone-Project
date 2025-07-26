# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **ChoreMinder**, an AI-powered household management application built on the FeNAgO SaaS boilerplate. The application helps parents assign, track, and verify chores for their children through automation, messaging, photo verification, and gamification.

The project is built with:
- **Frontend**: Next.js 14 (App Router), TailwindCSS, DaisyUI, TypeScript
- **Backend**: Next.js API Routes, MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with Google OAuth and magic links
- **Payments**: Stripe integration for subscriptions
- **AI Integration**: OpenAI GPT for personalized chore instructions
- **Storage**: AWS S3 for photo verification uploads
- **Email**: Resend for transactional emails

## Common Development Commands

### Development
```bash
# Start development server
npm run dev
# or
pnpm dev

# Build for production
npm run build

# Start production server
npm run start
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Generate sitemap (runs automatically after build)
npm run postbuild
```

### Database Operations
```bash
# Seed development data
npx tsx scripts/seed-dev.ts

# Test MongoDB connection
npx tsx scripts/test-connection.ts

# Test MongoDB with mongoose
npx tsx scripts/test-mongodb.ts

# Test email functionality
node scripts/test-resend.js
```

### Testing Specific Services
```bash
# Test database connection
npx tsx scripts/test-connection.ts

# Test email service
node scripts/test-resend.js

# Test S3 connection (via API route)
# Visit: http://localhost:3000/api/s3-test
```

## Architecture Overview

### Database Models
The application uses MongoDB with Mongoose and follows a family-based hierarchy:

- **User**: Core user model with roles (user, admin, parent, child), Stripe integration, and family relationships
- **Family**: Groups users into families with member roles and permissions
- **Chore**: Complex chore model with recurrence, photo verification, history tracking, and status management
- **Lead**: Basic lead capture model for marketing

### Key Database Patterns
- **Soft Deletes**: Chores use `deletedAt` field instead of hard deletion
- **History Tracking**: All chore changes are logged in embedded `history` array
- **Recurring Tasks**: Automatic chore generation based on recurrence rules
- **Photo Verification**: Embedded verification workflow with approval states

### API Routes Structure
```
/app/api/
├── auth/[...nextauth]/     # NextAuth.js authentication
├── chores/                 # Main chore CRUD operations
│   ├── [id]/              # Individual chore operations
│   │   ├── assign/        # Chore assignment
│   │   └── status/        # Status updates
├── families/[familyId]/    # Family-specific operations
├── stripe/                 # Payment processing
├── webhook/stripe/         # Stripe webhook handling
├── users/                  # User management
└── test-*/                # Development testing endpoints
```

### Authentication & Authorization
- Uses NextAuth.js with session-based authentication
- Family-based access control through middleware
- Role-based permissions (parent, child, admin)
- Session includes user ID, role, and family context

### Database Connection
- Uses both Mongoose (for models) and native MongoDB driver (for NextAuth.js)
- Connection handled in `libs/mongoose.ts` with environment-based configuration
- Supports both `DATABASE_URL` and `MONGODB_URI` environment variables

## Environment Setup

### Required Environment Variables
Create `.env.local` with:

```env
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=your-resend-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (for photo uploads)
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_REGION=us-east-1

# Optional: Messaging
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-phone
```

## Development Patterns

### TypeScript Path Aliases
The project uses these path aliases (configured in `tsconfig.json`):
- `@/*` - Root directory
- `@/lib/*` - Library files
- `@/models/*` - Database models
- `@/app/*` - App directory files

### Component Architecture
- **Components**: Reusable UI components in `/components/`
- **Pages**: Next.js App Router pages in `/app/`
- **Layouts**: Shared layouts with client-side interactivity via `LayoutClient.tsx`
- **API**: Server-side API routes in `/app/api/`

### Data Fetching Patterns
- API calls through utility functions in `libs/api.ts`
- Server-side authentication via `getServerSession(authOptions)`
- Client-side state management through React hooks
- Error handling with consistent JSON error responses

### Database Query Patterns
- Family-scoped queries: Always filter by user's family membership
- Soft delete queries: Filter `deletedAt: null` automatically via middleware
- Population: Consistent population of user and family references
- Pagination: Standard limit/skip pattern with total counts

### Chore Lifecycle Management
- **Creation**: Automatic history entry and validation
- **Status Changes**: Pre-save hooks handle timestamps and recurring task generation
- **Recurring Tasks**: Automatic creation of next occurrence when completed
- **Photo Verification**: Embedded workflow with approval tracking

## Key Configuration Files

### Application Config (`config.ts`)
Central configuration for:
- App branding and metadata
- Stripe pricing plans
- Email settings (Resend)
- AWS S3 configuration
- Color themes (DaisyUI)

### Tailwind Config (`tailwind.config.js`)
- Custom animations and keyframes
- DaisyUI integration with light/dark themes
- Custom gradient backgrounds
- Extended color palette

### Next.js Config (`next.config.js`)
- Image domain whitelist for external images
- Build optimizations

## Development Documentation

The project includes comprehensive documentation in:
- `DevDocs/` - Setup guides for external services (email, database, auth, payments, etc.)
- `DevPlanDocs/` - Architecture diagrams, development roadmap, and planning documents
- `README.md` - Project overview and setup instructions

### Key Documentation Files
- `DevDocs/0_UI_Components_Guide.md` - UI component usage with DaisyUI and Tailwind
- `DevPlanDocs/1-Architecture-Overview.md` - Detailed system architecture
- `DevPlanDocs/5-Database-Models.md` - Database schema documentation
- `DevPlanDocs/6-Authentication-System.md` - Auth implementation details

## Common Development Tasks

### Adding New API Endpoints
1. Create route file in `/app/api/`
2. Import `getServerSession` for authentication
3. Use `dbConnect()` for database access
4. Follow family-scoped query patterns
5. Add proper error handling and status codes

### Working with Database Models
1. Import models from `/models/`
2. Use TypeScript interfaces for type safety
3. Follow soft delete patterns for chores
4. Use proper population for relationships
5. Add validation and error handling

### Testing Database Changes
1. Use `npx tsx scripts/test-connection.ts` to verify connectivity
2. Run `npx tsx scripts/seed-dev.ts` to populate test data
3. Check API endpoints via browser or Postman
4. Monitor console for Mongoose connection logs

### Working with Stripe Integration
1. Test webhooks using Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook/stripe`
2. Use test mode price IDs from `config.ts`
3. Verify webhook signature validation
4. Check customer ID format validation in User model

### Photo Upload Implementation
1. Use AWS S3 integration in `libs/s3.ts`
2. Test upload functionality via `/api/s3-test`
3. Follow photo verification workflow in Chore model
4. Handle approval/rejection states properly