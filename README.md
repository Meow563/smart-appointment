# AI-Powered Student Helpdesk Bot (Supabase Edition)

Production-ready omnichannel student support bot with AI responses, Supabase persistence, and an admin dashboard.

## Architecture

- **Backend:** Node.js + Express REST API, webhook receivers for WhatsApp/Facebook, OpenAI service, Supabase data access.
- **Frontend:** React + Vite + Tailwind admin dashboard with Supabase Auth.
- **Database:** Supabase PostgreSQL with RLS, role-aware policies, analytics SQL functions.

## Folder Structure

```txt
/server
  /controllers
  /routes
  /services
  /middlewares
  supabaseClient.js
  server.js
/client
  /components
  /pages
  /hooks
  /services
  main.jsx
/supabase/migrations
/docs
```

## Setup

### 1) Environment

Copy `.env.example` to `.env` and fill in all values.

For frontend, create `client/.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2) Install dependencies

```bash
npm install --prefix server
npm install --prefix client
```

### 3) Run database migration

Apply SQL from `supabase/migrations/001_initial_schema.sql` in Supabase SQL editor.

### 4) Start apps

```bash
npm run dev --prefix server
npm run dev --prefix client
```

## Supabase Auth + Roles

- Admins sign in via email/password.
- Insert admin role rows into `public.admin_roles` for each auth user.
- Allowed roles: `admin`, `super_admin`.

## Webhooks

- WhatsApp verification: `GET /webhook/whatsapp`
- WhatsApp inbound: `POST /webhook/whatsapp`
- Facebook verification: `GET /webhook/facebook`
- Facebook inbound: `POST /webhook/facebook`

Set `VERIFY_TOKEN` in both Meta app webhook configs.

## Deployment

### Backend (Vercel or any Node host)

1. Deploy `/server` as Node service.
2. Add environment variables from `.env.example`.
3. Configure webhook URLs in Meta developer dashboard.

### Frontend (Vercel)

1. Deploy `/client`.
2. Set Vite env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`).
3. Ensure backend CORS `CLIENT_ORIGIN` includes deployed frontend URL.

## API Documentation

See `docs/api.md` for endpoint contracts.
