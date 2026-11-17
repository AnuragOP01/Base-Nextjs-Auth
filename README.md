# Auth Base

Minimal Next.js starter for email OTP sign-in, optional Google OAuth, Auth.js sessions, Drizzle ORM, Neon Postgres, and shadcn/ui.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to your Neon Postgres connection string.
3. Generate an Auth.js secret with `openssl rand -base64 32` and set `AUTH_SECRET`.
4. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and optionally `EMAIL_FROM`.
5. Apply the checked-in database schema:

   ```bash
   npm run db:migrate
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000/login`. The root route redirects there. After login, `/dashboard` shows the current session and a sign-out button.

## Optional Google login

Create a Google OAuth client and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`. Add this authorized redirect URI to that client:

```text
http://localhost:3000/api/auth/callback/google
```

Google sign-in is hidden until both variables are configured.

## Database changes

The auth schema is in `src/db/schema.ts`. After changing it, create a migration and apply it:

```bash
npm run db:generate
npm run db:migrate
```

OTP values are generated with cryptographic randomness, stored as keyed hashes, expire after 10 minutes, allow at most five verification attempts, and have a per-email resend cooldown. Add infrastructure-level/IP rate limiting before exposing the app to production traffic.
