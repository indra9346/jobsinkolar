# Jobs in Kolar — Project Brief

## Objective

Rebuild the public Jobs in Kolar website as a complete, responsive local job marketplace. Use `https://jobsinkolar.com` and the supplied screenshots as product and visual references. Build and keep the source code in this folder. The project owner will create the Git repository later and deploy through Vercel.

## Product

Jobs in Kolar connects people looking for work with employers hiring in Kolar and nearby communities. The experience should feel clear, welcoming, fast, and locally relevant on desktop and mobile.

## Accounts and capabilities

- Candidates can create an account, maintain a profile, find jobs, save roles, apply, and view their application status.
- Employers can create an account, submit job posts for review, and view their posts and applicants.
- Administrators can approve or reject job posts and proposed locations.
- Visitors can browse published jobs and categories, search by title and area, subscribe to local job updates, and suggest a missing area.

## Pages

- Home: search, popular searches, how it works, job categories, recommended local roles, employer call to action, newsletter.
- Jobs: searchable and filterable listing, job details, save and apply actions.
- Job categories and About.
- Authentication: candidate or employer signup, sign-in, email confirmation through Supabase Auth.
- Candidate and employer dashboards.
- Employer job submission.
- Administrator review dashboard.

## Technical approach

- Next.js App Router, React, TypeScript and responsive CSS.
- Supabase Auth, Postgres, Row Level Security and private Storage for candidate documents.
- Vercel deployment, configured by the project owner after creating the repository.
- Use only the Supabase public URL and anon key in browser code. Keep the service-role key and database credentials private.

## Data model

Profiles, job categories, jobs, applications, saved jobs, newsletter subscribers, areas, and area suggestions. Job applications and employer-only data must be protected by Row Level Security. Employer job posts and area suggestions require administrator approval before public use.

## Quality goals

- Match the supplied Jobs in Kolar identity: white navigation, red brand accents, clear typography, generous spacing, and a simple job marketplace layout.
- Work well on narrow and wide screens and keep navigation and forms accessible.
- Make the search, account, job-posting, application, newsletter, saved-job, and moderation flows use real Supabase data.
- Keep secrets out of the client bundle and out of source control.

## Reference observations

The live home page presents local job search, manufacturing/technology/healthcare categories, recommended roles, an employer posting call to action, and newsletter signup. The supplied first image also shows the shared Jobs in Kolar header and footer. The second image identifies a Supabase project named `jobsinkolar`; it does not provide a database password or Supabase Management API token.
