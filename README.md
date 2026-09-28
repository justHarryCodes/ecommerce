# Build&Funish: Company Website and Online Shop

A complete website, online shop and content management system for **Build&Funish**, a fabrication and interiors business. The company covers metal fabrication, aluminium and glass, woodworking, decorative concrete and full interior fit-outs.

Visitors can browse services and past projects, request quotes, apply for jobs and buy products online. The team manages all of it from one admin dashboard.

## Features

**Public site**
- Services, a project portfolio, a gallery and customer testimonials
- A blog, a careers page with online applications, and a contact form with newsletter sign-up
- **Shop:** product catalogue with search, cart, checkout and delivery fees by zone
- **Payments:** Paystack card payments or bank transfer
- **Customer accounts:** sign up, saved addresses, order history and order details
- **Quote requests** for custom fabrication and fit-out work

**Admin dashboard (`/dashboard`)**
- Manage products, categories, orders and customers
- Publish services, projects, gallery images, blog posts and testimonials
- Post jobs and review applications
- Review quote requests
- Edit the storefront and company settings, including contact details
- Analytics

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) with React and TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Auth | Firebase Authentication with session cookies; admin access by allow-listed email |
| Database | PostgreSQL (`pg`) with versioned SQL migrations |
| Cache | Redis (`ioredis`) |
| Payments | Paystack |
| Media | Cloudinary |
| Forms | react-hook-form and Zod |
| Cart | Zustand (persisted) |

## Getting started

**Requirements:** Node.js 20+, PostgreSQL, Redis, a Firebase project, and Cloudinary and Paystack accounts.

```bash
git clone https://github.com/justHarryCodes/ecommerce.git
cd ecommerce
npm install
cp .env.example .env.local        # fill in the values

psql -d yourdb -f schema.sql      # base schema
npm run db:migrate                # apply migrations/ in order

npm run dev                       # http://localhost:3000
```

> `npm run build` runs the migrations before building, so point `DATABASE_URL` at the right database before you deploy.

## Environment variables

| Group | Variables |
|---|---|
| Core | `DATABASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_APP_URL` |
| Firebase | `NEXT_PUBLIC_FIREBASE_*` (client), `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` |
| Payments | `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` |
| Media | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` |
| Access | `ADMIN_EMAILS`: a comma-separated list of emails allowed into `/dashboard` |

See [`.env.example`](.env.example) for the full template.

## Project structure

```
src/
├── app/
│   ├── (site)/        # Public pages: home, about, services, projects, gallery, blog,
│   │                  # careers, contact, products, checkout, customer account portal
│   ├── dashboard/     # Admin CMS and shop management
│   ├── auth/          # Admin sign-in
│   └── api/           # Route handlers for every resource
├── components/  lib/  styles/  types/
migrations/            # Numbered, idempotent SQL migrations
schema.sql             # Base schema
```

## Deployment

The site deploys to Vercel with a managed Postgres (Neon or Supabase) and Redis (Upstash). Add every environment variable in the hosting dashboard and set the Paystack webhook to `https://<your-domain>/api/paystack/webhook`.
