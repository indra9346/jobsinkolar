# Jobs in Kolar

Local job marketplace for Kolar district (Kolar, Malur, Bangarpet, KGF, Mulbagal, Srinivaspur) with three portals: job seekers, employers and administrators. The hiring model follows apnaHire: job-post credits, candidate-database unlock credits, admin-moderated listings and an applicant pipeline.

**Stack:** Next.js 15 (App Router, React 19), TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth, Storage, Realtime, Edge Functions), Razorpay, deployed on Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the Supabase URL and anon key
npm run dev
```

Open http://localhost:3000. Only the public anon key goes in `.env.local`; never put a service-role key in a `NEXT_PUBLIC_` variable.

## What's in the app

| Area | Routes |
|---|---|
| Public | `/`, `/jobs` (server-side search, filters, sort, pagination), `/jobs/[id]`, `/companies`, `/companies/[slug]`, `/employers` (pricing), `/job-alerts`, `/suggest-area`, `/about`, `/contact`, `/privacy`, `/terms`, `/safety` |
| Auth | `/login`, `/register` (job seeker / employer), `/forgot-password`, `/reset-password`, `/auth/callback` |
| Job seeker `/candidate` | overview with profile strength, applications + timeline, saved jobs, messages, profile and work history, documents, job alerts, notifications, settings |
| Employer `/employer` | overview, 4-step job wizard, jobs, applicant pipeline (shortlist, interview scheduler, offer, hire, private notes), candidate database with unlocks and saved searches, messages, company profile, credits and Razorpay billing with GST invoices, reports with CSV export |
| Admin `/admin` | overview, job moderation (approve / request changes / close / feature), employers (verify, suspend, block, adjust credits), candidates, applications audit, document verification, payments, areas, job-alert email queue, contact inbox, audit log |

`middleware.ts` guards each portal by the `role` claim in the JWT; every rule is also enforced in Postgres with row-level security and triggers, so the database is the source of truth.

## Business rules (enforced in the database)

- **Job lifecycle:** draft → in review → live / needs changes → closed. Only admins publish. Submitting a job uses one job credit; resubmitting after a rejection is free. Editing the title, description, salary, category or location of a live job sends it back to review. Jobs expire after the plan's job duration (30–60 days).
- **Credits:** every new employer gets the Free plan (2 job posts, 5 unlocks, no expiry). Paid plans add credits and extend validity. Credits are only granted by `apply_paid_order` (called by the payment functions) or by an admin adjustment, and every change is written to `credit_ledger`.
- **Applications:** one per candidate per job; screening answers required; status pipeline Applied → Under review → Shortlisted → Interview → Offered → Hired, or Not selected / Withdrawn. Candidates can only withdraw; employers can't set Withdrawn; interviews need a date; hired and withdrawn applications are closed. Every change notifies the other side and is logged in `application_events`.
- **Privacy:** candidate contact details and documents are visible only to employers they applied to, or verified employers who unlocked them (1 credit, idempotent). Unverified companies can search but not unlock.
- **Messages:** tied to an application. Employers can always write; candidates can reply once shortlisted or after the employer writes first.

Run the end-to-end test (42 checks, fully rolled back, safe on the live project):

```bash
npx supabase db query --linked -f supabase/tests/business_flows.sql
```

A passing run ends with the error text `ALL_FLOWS_PASSED (42 checks)`; the raised error is what rolls everything back.

## Database

Migrations live in `supabase/migrations/` and are applied with:

```bash
npx supabase db push --linked
```

### Make yourself an administrator

Register normally, then run in the Supabase SQL editor:

```sql
update public.profiles set is_admin = true, role = 'admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

Sign out and back in so your session picks up the admin role.

## Payments (Razorpay)

Plans and prices live in the `plans` table. To take payments online:

1. Set these Edge Function secrets in Supabase: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PUBLIC_APP_URL`.
2. Deploy the functions:
   ```bash
   npx supabase functions deploy create-payment-order
   npx supabase functions deploy verify-payment
   npx supabase functions deploy razorpay-webhook --no-verify-jwt
   ```
3. In Razorpay, add a webhook for `payment.captured` pointing to `https://<project-ref>.supabase.co/functions/v1/razorpay-webhook` with the same webhook secret.

Until this is set up, the Buy button offers to request a payment link instead (it lands in Admin → Contact inbox); admins can then add the credits from Admin → Employers.

## Job-alert emails

Publishing a job queues `job_alert_deliveries`. The `dispatch-job-alert` function sends them via Resend once these secrets are set: `RESEND_API_KEY`, `ALERT_FROM_EMAIL`, `PUBLIC_APP_URL`, `JOB_ALERT_WEBHOOK_SECRET`. Deploy it with `--no-verify-jwt` and add a database webhook on `job_alert_deliveries` INSERT that sends the header `x-job-alert-secret`. In-app alerts work without email.

## Deploy

Import the repository in Vercel and add the variables from `.env.example`. `vercel.json` pins functions to `icn1` (Seoul), next to the Supabase database, for the fastest server rendering. Public pages are statically generated and revalidated every 1–5 minutes; job and company pages are cached on first view.
