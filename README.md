# Ask Coach SaaS

Ask Coach is a multi-tenant youth sports communication assistant. Coaches publish baseball game details in a Next.js dashboard, parents ask natural questions in GroupMe, and the bot answers from tenant-scoped game data and FAQs.

## Included architecture

- Next.js App Router, TypeScript, Tailwind CSS, Vercel-ready route handlers
- Supabase Auth, Postgres schema, RLS policies, and starter seed SQL
- Multi-tenant organizations, members, teams, GroupMe connections, games, FAQs, message logs, reminders, subscriptions, and usage counters
- GroupMe bot registration/posting service and webhook at `/api/groupme/webhook`
- OpenAI answer engine with intent classification, safe answer generation, deterministic fallback, and follow-up suggestions
- Vercel Cron endpoint at `/api/cron/reminders`
- Billing-ready plan config, usage helpers, checkout stub, and Stripe webhook placeholder

## Local development

1. Install Node 20+.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Create a Supabase project and run `sql/migrations/001_initial_schema.sql` in the Supabase SQL editor.
5. Fill `.env.local` with Supabase, OpenAI, GroupMe, and cron values.
6. Start the app:
   ```bash
   npm run dev
   ```
7. Visit `http://localhost:3000/signup`, create a coach account, then create an organization/team.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` optional, defaults to `gpt-4o-mini`
- `GROUPME_BOT_NAME_DEFAULT`
- `APP_URL`
- `GROUPME_TOKEN_ENCRYPTION_SECRET` placeholder for production KMS/Vault strategy
- `CRON_SECRET`
- Stripe placeholders: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Supabase setup

Run the migration before using the app. RLS policies allow users to access only organizations where they are members. Service-role routes are used only for external webhooks and cron. The `profiles` table is populated by an auth trigger.

## Vercel deployment

1. Import the repo in Vercel.
2. Set the environment variables above.
3. Set `APP_URL=https://your-vercel-domain.vercel.app`.
4. `vercel.json` schedules `/api/cron/reminders` every 15 minutes. If `CRON_SECRET` is set, configure the cron authorization header to `Bearer <CRON_SECRET>` or remove the secret check for managed-only invocations.
5. Deploy. Next.js route handlers run as Vercel Functions.

## GroupMe setup/testing

1. In the dashboard, open a team and go to **GroupMe integration**.
2. Enter a GroupMe access token, group ID, and optional bot name.
3. The app calls GroupMe bot creation with callback URL `${APP_URL}/api/groupme/webhook` and stores the bot ID by tenant/team.
4. Post a question in the GroupMe group, for example: `What time and where is the game?`.
5. The webhook resolves `group_id -> groupme_connections -> organization/team`, fetches active game + FAQs, generates an answer, posts with the correct `bot_id`, and logs the exchange.

## Manual checks

- Create two organizations with different users and confirm RLS isolates teams/games/FAQs/logs.
- Connect distinct GroupMe groups and confirm webhook routing by `group_id`.
- Ask multi-intent questions like `what time and where is it?`.
- Verify unknown details answer with `Coach has not posted that yet` instead of hallucinating.
- Trigger manual reminders from `/app/team/[teamId]/reminders`.

## Production notes

- `access_token_encrypted` is intentionally isolated and marked as a placeholder. Replace the base64 placeholder with envelope encryption via KMS/Vault or avoid storing GroupMe access tokens after bot creation.
- Stripe checkout is stubbed in `lib/billing.ts` and `/api/billing/checkout`; add price IDs and webhook verification when monetization is enabled.
- The database type file is hand-authored for the MVP. Generate it with the Supabase CLI as the schema grows.
