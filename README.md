# ChoreMinder

**Intelligent Chore Management for Modern Families**

ChoreMinder is an AI-powered household management app designed to help parents assign, track, and verify chores for their children. Built on top of the secure and scalable FeNAgO SaaS boilerplate, ChoreMinder brings together automation, messaging, photo verification, and gamification to make family collaboration fun and effective.

---

## 🧭 Mission Statement

**ChoreMinder empowers families to stay organized, teach responsibility, and foster healthy habits — one chore at a time.**

---

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), TailwindCSS, DaisyUI, TypeScript
- **Backend**: API Routes, MongoDB (Mongoose), NextAuth.js
- **AI**: OpenAI GPT integration for personalized chore instructions
- **Messaging**: Resend (email), WhatsApp API, SMS (Twilio)
- **Storage**: AWS S3 for photo verification uploads
- **Payments**: Stripe integration (optional)

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/choreminder.git
cd choreminder
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Update the following keys in `.env.local`:

```env
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_REGION=
```

### 4. Run Locally

```bash
pnpm dev
# or
npm run dev
```

App will be available at [http://localhost:3000](http://localhost:3000)

---

## 📌 Project Structure

ChoreMinder uses the FeNAgO app directory structure with extensions:

```
/
├── app/                # Next.js App Router
├── components/         # Shared and role-specific UI components
├── models/             # Mongoose schemas (User, Family, Chore)
├── libs/               # Utility libraries (API, GPT, Auth, S3)
├── public/             # Static assets (logo, icons)
├── types/              # TypeScript type definitions
├── DevDocs/            # Developer documentation
└── DevPlanDocs/        # Project planning docs
```

---

## 🛠️ ChoreMinder-Specific Extensions (Coming Soon)

- `models/Family.ts` — family schema and relationships
- `models/Chore.ts` — core chore tracking with verification and scheduling
- `components/ParentDashboard.tsx` — chore assignment and tracking interface
- `components/ChildDashboard.tsx` — gamified view for children
- `libs/whatsapp.ts`, `libs/sms.ts` — multi-channel messaging integration
- `app/api/chores` — chore management endpoints
- `app/api/photo-verification` — image upload and approval workflows
- `middleware/familyAuth.ts` — custom access control middleware
- `scripts/seed-dev.ts` — development seeding script

---

## ✅ TODO (Early Setup Phase)

- [ ] Rebrand visual assets (logo, favicon, theme)
- [ ] Seed sample families and chores
- [ ] Implement family switching logic
- [ ] Extend NextAuth session with role and family data
- [ ] Test MongoDB and AWS S3 connections

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE) for full terms.
