# Jobs in Kolar

A responsive Kolar district jobs marketplace built with Next.js App Router, TypeScript, React, Supabase Auth, Postgres, Storage and Realtime.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase project's API settings. Never place a service-role key in a `NEXT_PUBLIC_` variable or commit `.env.local`.
3. Run `npm install`, then `npm run dev`, and open `http://localhost:3000`.

The app uses the public anon key in the browser. Row-level security (RLS) controls access; admin-only actions also check the signed-in user's `profiles.is_admin` flag. The project-specific Supabase link file is ignored by Git.

## Supabase database

The versioned migrations are in `supabase/migrations/`:

- `202610130001_initial_schema.sql` creates the marketplace tables, Auth profile trigger, storage bucket, categories, and baseline RLS policies.
- `202610130002_admin_realtime_job_alerts.sql` adds admin-managed profile statuses, status history and private notes, private profile/application reads, canonical Kolar taluks and verified localities, subscriptions, notifications, delivery queue, and Realtime publication membership.
- `202610130003_account_access_guards.sql` prevents blocked accounts from creating job applications or employer posts, and enforces verified locations in the database.
- `202610130004_require_verified_published_jobs.sql` prevents any job without an active verified Kolar locality from becoming public.

Apply migrations to the linked Supabase project with `npx supabase db push --linked`. To grant administrator access, use the Supabase SQL editor with the intended account email:

```sql
update public.profiles
set is_admin = true, role = 'admin'
where id = (select id from auth.users where email = 'ADMIN_EMAIL');
```

Do not put passwords, service keys, or real candidate data into `supabase/seed.sql`. That file intentionally contains no test accounts or sample jobs. Region and category reference data are versioned in migrations.

## Admin access and privacy

- `/admin` manages pending employer jobs and area suggestions.
- `/admin/profiles` is the private profile console. It supports search, account lock/suspension, recruitment interest status, private notes, history, and admin-only resume links.
- `/admin/applications` reviews applications, updates application status, and provides admin-only resume access.
- `/admin/jobs/new` publishes a job from a canonical taluk and verified locality.
- `/admin/areas` verifies or deactivates localities and records their source.
- `/admin/alerts` shows the job-email delivery queue.
- A profile is visible only to its owner and an administrator. Application details are visible only to the candidate and administrators. Employers cannot browse candidate identities or resumes.
- Candidate dashboards receive profile-status and application-status changes through Realtime. Signed-in subscribers receive new matching-job notifications in the notification bell.

The canonical district taluks are Kolar, Malur, Bangarpet, KGF, Mulbagal, and Srinivaspur. The job-posting form accepts only active, verified localities from the database.

## Job-alert email delivery

Publishing a matching job creates an idempotent `job_alert_deliveries` queue row. Email dispatch is implemented in `supabase/functions/dispatch-job-alert/` and uses Resend. To enable outbound email, the project owner must configure a verified Resend sender and the following Supabase Edge Function secrets:

- `RESEND_API_KEY`
- `ALERT_FROM_EMAIL` (the verified sender address)
- `PUBLIC_APP_URL` (for job and unsubscribe links)
- `JOB_ALERT_WEBHOOK_SECRET` (a long random value)

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function at runtime. Deploy `dispatch-job-alert` with JWT verification disabled because the database webhook authenticates with its custom secret header. In the Supabase Dashboard, create a Database Webhook for `public.job_alert_deliveries`, `INSERT` events, POSTing to `https://<project-ref>.supabase.co/functions/v1/dispatch-job-alert` with header `x-job-alert-secret: <same JOB_ALERT_WEBHOOK_SECRET>`. Check `/admin/alerts` after publishing to confirm the delivery state. Until the Resend key, sender and webhook are configured, job alerts remain queued and in-app alerts continue to work.

The function can be deployed with `npx supabase functions deploy dispatch-job-alert --project-ref <project-ref>` after adding the settings above. See [Supabase Edge Function deployment](https://supabase.com/docs/guides/functions/deploy), [function configuration](https://supabase.com/docs/guides/functions/function-configuration), and [database webhooks](https://supabase.com/docs/guides/database/webhooks).

## Deploy to Vercel

Push the project to the repository when ready, then import it into Vercel and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as project environment variables. Apply Supabase migrations separately; a Vercel deploy does not apply database schema changes.
