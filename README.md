# Svit Vasad Campus

A minimal Node.js + Supabase login portal scaffold.

## Features

- Express API server
- Supabase auth integration
- Browser-based signup/login UI
- Profile view with session restore

## Setup

1. Copy `.env.example` to `.env`.
2. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `SUPABASE_PUBLISHABLE_KEY`.
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm run dev
```

5. Open http://localhost:3000 in your browser.

## API Endpoints

- `POST /signup` — create a new user
- `POST /login` — sign in and receive a session
- `GET /profile` — fetch authenticated user profile with `Authorization: Bearer <token>`
- `GET /api-status` — check API health

## Frontend

A simple static UI is available at `/`:

- `src/public/index.html`
- `src/public/app.js`
- `src/public/styles.css`

The browser UI stores the login session locally and restores it on refresh.

## Notes

- `SUPABASE_PUBLISHABLE_KEY` is optional for public client usage.
- `SUPABASE_SERVICE_ROLE_KEY` is only used server-side and is kept private in `.env`.
