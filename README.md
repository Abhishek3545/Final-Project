# Retail Realm X

A full-stack marketplace web app built with React, Vite, Tailwind, shadcn/ui, and Supabase.

The project includes:

- Multi-category commerce (products, clothes, grocery, travel, tickets)
- Cart and wishlist with backend persistence
- Checkout and order tracking timeline
- Multi-mode authentication (email, Google, phone, and dummy mode)
- Analytics dashboard with backend summary view and Excel-like planning sheet
- System health dashboard for backend readiness checks
- Theme switcher (Light, Dark, System)

## Tech Stack

- Frontend: React 18, TypeScript, Vite
- UI: Tailwind CSS, shadcn/ui, Radix UI, Lucide icons
- Routing: React Router
- Data fetching and caching: TanStack Query
- Backend: Supabase (Auth, Postgres, RLS)

## Key Features

### Commerce

- Product listing with search, filters, and sorting
- Dedicated clothes page with backend and fallback data
- Cart management with quantity updates and duplicate-safe insertion
- Wishlist with add/remove and cart transfer

### Service Marketplace

- Travel packages with destination exploration section
- Tickets marketplace with live events, bus tickets, and movie tickets

### Checkout and Tracking

- Checkout flow with order creation
- Tracking events for order timeline and location display

### Auth and Session

- Email/password login and signup
- Email magic link support
- Google OAuth and phone OTP flows
- Dummy auth mode for testing without external provider setup

### Analytics and Health

- Analytics dashboard with KPI cards and daily summary table
- Excel-like editable planning sheet with backend save and CSV export
- Guest analytics mode (works without login using local storage)
- Backend health dashboard with environment, network, auth, and table checks

## Getting Started

### 1. Install dependencies

Run:

npm install

### 2. Configure environment

Create a local environment file and set values:

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_AUTH_DUMMY_MODE=true

If you want strict real auth only, set:

VITE_AUTH_DUMMY_MODE=false

### 3. Apply Supabase migrations

Run these SQL files in Supabase SQL Editor in order:

1. supabase/migrations/20260409_add_budget_and_tracking.sql
2. supabase/migrations/20260409_expand_marketplace_backend.sql
3. supabase/migrations/20260409_seed_20plus_inventory.sql
4. supabase/migrations/20260409_add_auth_demo_backend.sql
5. supabase/migrations/20260409_add_cart_backend_and_seed_15_sets.sql
6. supabase/migrations/20260409_add_analytics_dashboard_backend.sql

### 4. Start development server

Run:

npm run dev

### 5. Build for production

Run:

npm run build

## Available Scripts

- npm run dev: Start local development server
- npm run build: Production build
- npm run build:dev: Development-mode build
- npm run lint: Lint source files
- npm run preview: Preview production build locally

## Important Routes

- /: Home
- /products: All products
- /clothes: Dedicated clothes catalog
- /cart: Cart
- /wishlist: Wishlist
- /checkout: Checkout
- /orders: Orders and bookings
- /track-order: Tracking dashboard
- /travel: Travel marketplace
- /tickets: Tickets marketplace
- /analytics: Analytics dashboard
- /system-health: Backend health dashboard

## Analytics Dashboard Notes

The analytics module supports two modes:

- Signed-in mode: reads and writes analytics from Supabase backend
- Guest mode: works without login using local browser storage

Planning sheet supports:

- Editable rows and values
- Save state
- CSV export for spreadsheet usage

## Backend and RLS Notes

- Cart and wishlist tables use per-user row-level security
- Service bookings and order tracking use user-scoped checks
- Analytics sheet rows are user-scoped with unique period and metric keys

## Troubleshooting

- If dashboard checks fail, open /system-health and run checks.
- If auth providers fail, enable dummy mode with VITE_AUTH_DUMMY_MODE=true.
- If cart, wishlist, travel, or analytics tables are missing, re-run migrations in order.

## Project Status

This project is production-oriented and actively extended with advanced modules.

