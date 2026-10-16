-- Jobs in Kolar v2: full three-portal marketplace.
-- Candidate profiles + documents, company pages, employer applicant pipeline,
-- messaging, talent pool with unlock credits, plans/wallet/payments, audit log.
-- Strictly additive: no table or data is dropped.

------------------------------------------------------------------------------
-- 0. Helpers
------------------------------------------------------------------------------
create or replace function public.current_user_role() returns text
language sql stable security definer set search_path = '' as $$
  select case when p.is_admin then 'admin' else p.role end
  from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.current_user_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.account_status = 'active' from public.profiles p where p.id = auth.uid()), false)
$$;

------------------------------------------------------------------------------
-- 1. Candidate profile fields
------------------------------------------------------------------------------
alter table public.profiles add column if not exists current_title text;
alter table public.profiles add column if not exists experience_years integer check (experience_years is null or experience_years between 0 and 50);
alter table public.profiles add column if not exists education text;
alter table public.profiles add column if not exists expected_salary integer check (expected_salary is null or expected_salary >= 0);
alter table public.profiles add column if not exists availability text check (availability is null or availability in ('immediate','15_days','30_days','60_days'));
alter table public.profiles add column if not exists languages text[] not null default '{}';
alter table public.profiles add column if not exists taluk text references public.taluks(name);
alter table public.profiles add column if not exists open_to_work boolean not null default true;
alter table public.profiles add column if not exists talent_visible boolean not null default true;
alter table public.profiles add column if not exists preferred_categories text[] not null default '{}';
alter table public.profiles add column if not exists last_active_at timestamptz not null default now();

create table if not exists public.candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 2 and 120),
  company text not null check (length(trim(company)) between 1 and 120),
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  description text check (description is null or length(description) <= 2000),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);
create index if not exists candidate_experiences_idx on public.candidate_experiences(candidate_id, start_date desc);

create table if not exists public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('resume','id_proof','education','experience_letter','certificate','other')),
  file_path text not null,
  file_name text not null,
  size_bytes integer,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists candidate_documents_idx on public.candidate_documents(candidate_id, created_at desc);
create index if not exists candidate_documents_status_idx on public.candidate_documents(status, created_at);

------------------------------------------------------------------------------
-- 2. Companies (public page) — private billing data stays in company_private
------------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 120),
  slug text not null unique,
  logo_path text,
  industry text,
  company_size text check (company_size is null or company_size in ('1-10','11-50','51-200','201-1000','1000+')),
  website text,
  about text check (about is null or length(about) <= 4000),
  taluk text references public.taluks(name),
  address text,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_private (
  id uuid primary key references public.companies(id) on delete cascade,
  contact_name text,
  contact_phone text,
  contact_email text,
  gstin text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$'),
  billing_address text,
  updated_at timestamptz not null default now()
);

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
drop trigger if exists company_private_updated_at on public.company_private;
create trigger company_private_updated_at before update on public.company_private for each row execute function public.set_updated_at();

create or replace function public.protect_company_verification() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() and auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.verified := false; new.verified_at := null;
    elsif new.verified is distinct from old.verified or new.verified_at is distinct from old.verified_at then
      raise exception 'Only an administrator can verify a company';
    end if;
  elsif tg_op = 'UPDATE' and new.verified and not old.verified then
    new.verified_at := now();
  end if;
  return new;
end $$;
drop trigger if exists protect_company_verification on public.companies;
create trigger protect_company_verification before insert or update on public.companies
  for each row execute procedure public.protect_company_verification();

------------------------------------------------------------------------------
-- 3. Plans, wallets, ledger, payments
------------------------------------------------------------------------------
create table if not exists public.plans (
  id text primary key,
  name text not null,
  tagline text,
  price_inr integer not null check (price_inr >= 0),
  job_credits integer not null default 0,
  unlock_credits integer not null default 0,
  validity_days integer not null default 30,
  job_duration_days integer not null default 30,
  featured_jobs boolean not null default false,
  highlight boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0
);
insert into public.plans(id,name,tagline,price_inr,job_credits,unlock_credits,validity_days,job_duration_days,featured_jobs,highlight,sort_order) values
  ('free','Free','For a first hire',0,2,5,365,30,false,false,0),
  ('starter','Starter','Small shops and clinics',999,5,40,30,30,false,false,1),
  ('growth','Growth','Growing teams hiring every month',2499,15,150,60,45,true,true,2),
  ('enterprise','Enterprise','Factories and volume hiring',5999,40,500,90,60,true,false,3)
on conflict(id) do nothing;

create table if not exists public.employer_wallets (
  employer_id uuid primary key references public.profiles(id) on delete cascade,
  plan_id text not null default 'free' references public.plans(id),
  job_credits integer not null default 0 check (job_credits >= 0),
  unlock_credits integer not null default 0 check (unlock_credits >= 0),
  job_duration_days integer not null default 30,
  featured_jobs boolean not null default false,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  job_delta integer not null default 0,
  unlock_delta integer not null default 0,
  reason text not null,
  ref_id uuid,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_idx on public.credit_ledger(employer_id, created_at desc);

create sequence if not exists public.invoice_seq start 1001;
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.plans(id),
  amount_inr integer not null,
  gst_inr integer not null,
  total_inr integer not null,
  provider text not null default 'razorpay',
  provider_order_id text unique,
  provider_payment_id text unique,
  status text not null default 'created' check (status in ('created','paid','failed','cancelled')),
  billing_name text,
  gstin text,
  invoice_no text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payment_orders_idx on public.payment_orders(employer_id, created_at desc);

-- Every employer gets a wallet seeded with the free plan, once.
create or replace function public.ensure_employer_wallet(p_employer uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.plans;
begin
  select * into f from public.plans where id = 'free';
  insert into public.employer_wallets(employer_id, plan_id, job_credits, unlock_credits, job_duration_days)
    values (p_employer, 'free', coalesce(f.job_credits,0), coalesce(f.unlock_credits,0), coalesce(f.job_duration_days,30))
    on conflict (employer_id) do nothing;
  if found then
    insert into public.credit_ledger(employer_id, job_delta, unlock_delta, reason)
      values (p_employer, coalesce(f.job_credits,0), coalesce(f.unlock_credits,0), 'Welcome credits (Free plan)');
  end if;
end $$;
revoke all on function public.ensure_employer_wallet(uuid) from public, anon, authenticated;

-- Granted only by the payment webhook/verify function (service role) or an admin.
create or replace function public.apply_paid_order(p_order uuid, p_payment_id text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare o public.payment_orders; pl public.plans;
begin
  select * into o from public.payment_orders where id = p_order for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status = 'paid' then return false; end if; -- idempotent
  select * into pl from public.plans where id = o.plan_id;
  update public.payment_orders set status='paid', provider_payment_id=p_payment_id, paid_at=now(),
    invoice_no = 'JIK-' || to_char(now(),'YYYY') || '-' || nextval('public.invoice_seq')
    where id = o.id;
  perform public.ensure_employer_wallet(o.employer_id);
  update public.employer_wallets set
    plan_id = pl.id,
    job_credits = job_credits + pl.job_credits,
    unlock_credits = unlock_credits + pl.unlock_credits,
    job_duration_days = greatest(job_duration_days, pl.job_duration_days),
    featured_jobs = featured_jobs or pl.featured_jobs,
    expires_at = greatest(coalesce(expires_at, now()), now()) + make_interval(days => pl.validity_days),
    updated_at = now()
  where employer_id = o.employer_id;
  insert into public.credit_ledger(employer_id, job_delta, unlock_delta, reason, ref_id)
    values (o.employer_id, pl.job_credits, pl.unlock_credits, pl.name || ' plan purchased', o.id);
  insert into public.notifications(user_id, kind, title, body, href)
    values (o.employer_id, 'credits', 'Payment received', pl.name || ' plan is active. Credits have been added to your account.', '/employer/billing');
  return true;
end $$;
revoke all on function public.apply_paid_order(uuid, text) from public, anon, authenticated;

create or replace function public.admin_grant_credits(p_employer uuid, p_jobs integer, p_unlocks integer, p_reason text, p_validity_days integer default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'Administrator access required'; end if;
  if coalesce(trim(p_reason),'') = '' then raise exception 'Enter a reason for this adjustment'; end if;
  perform public.ensure_employer_wallet(p_employer);
  update public.employer_wallets set
    job_credits = greatest(0, job_credits + coalesce(p_jobs,0)),
    unlock_credits = greatest(0, unlock_credits + coalesce(p_unlocks,0)),
    expires_at = case when p_validity_days is null then expires_at else greatest(coalesce(expires_at, now()), now()) + make_interval(days => p_validity_days) end,
    updated_at = now()
  where employer_id = p_employer;
  insert into public.credit_ledger(employer_id, job_delta, unlock_delta, reason, actor_id)
    values (p_employer, coalesce(p_jobs,0), coalesce(p_unlocks,0), p_reason, auth.uid());
  insert into public.notifications(user_id, kind, title, body, href)
    values (p_employer, 'credits', 'Credits updated', 'An administrator adjusted your credits: ' || p_reason, '/employer/billing');
end $$;
grant execute on function public.admin_grant_credits(uuid, integer, integer, text, integer) to authenticated;

create or replace function public.wallet_usable(w public.employer_wallets) returns boolean
language sql stable as $$ select w.expires_at is null or w.expires_at > now() or w.plan_id = 'free' $$;

------------------------------------------------------------------------------
-- 4. Jobs v2
------------------------------------------------------------------------------
alter table public.jobs add column if not exists company_id uuid references public.companies(id) on delete set null;
alter table public.jobs add column if not exists openings integer not null default 1 check (openings between 1 and 500);
alter table public.jobs add column if not exists work_mode text not null default 'on_site' check (work_mode in ('on_site','hybrid','remote'));
alter table public.jobs add column if not exists shift text not null default 'day' check (shift in ('day','night','rotational','flexible'));
alter table public.jobs add column if not exists salary_period text not null default 'month' check (salary_period in ('month','year','day'));
alter table public.jobs add column if not exists skills text[] not null default '{}';
alter table public.jobs add column if not exists benefits text[] not null default '{}';
alter table public.jobs add column if not exists education text;
alter table public.jobs add column if not exists experience_min integer not null default 0 check (experience_min between 0 and 40);
alter table public.jobs add column if not exists experience_max integer check (experience_max is null or experience_max between 0 and 50);
alter table public.jobs add column if not exists screening_questions jsonb not null default '[]'::jsonb;
alter table public.jobs add column if not exists deadline date;
alter table public.jobs add column if not exists rejection_reason text;
alter table public.jobs add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.jobs add column if not exists reviewed_at timestamptz;
alter table public.jobs add column if not exists published_at timestamptz;
alter table public.jobs add column if not exists submitted_at timestamptz;
alter table public.jobs add column if not exists credit_used boolean not null default false;
alter table public.jobs add column if not exists featured boolean not null default false;
alter table public.jobs add column if not exists views integer not null default 0;
alter table public.jobs add column if not exists applications_count integer not null default 0;
alter table public.jobs add column if not exists walk_in boolean not null default false;
alter table public.jobs add column if not exists contact_phone text;

do $$ begin
  alter table public.jobs add constraint jobs_screening_max check (jsonb_typeof(screening_questions) = 'array' and jsonb_array_length(screening_questions) <= 5);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.jobs add constraint jobs_exp_range check (experience_max is null or experience_max >= experience_min);
exception when duplicate_object then null; end $$;

create index if not exists jobs_public_idx on public.jobs(status, featured desc, published_at desc);
create index if not exists jobs_company_idx on public.jobs(company_id);
create index if not exists jobs_employer_idx on public.jobs(employer_id, created_at desc);

-- Job lifecycle. Replaces the old "only admins change status" trigger with an
-- explicit state machine that also consumes posting credits.
--   employer: draft -> pending_review (consumes 1 job credit the first time)
--             rejected -> pending_review (free resubmission)
--             published -> closed, closed -> published (if approved before and not expired)
--             editing content of a published job sends it back to review
--   admin:    pending_review -> published | rejected (reason required), any -> closed
drop trigger if exists protect_job_publication_status on public.jobs;

create or replace function public.job_lifecycle() returns trigger
language plpgsql security definer set search_path = '' as $$
declare is_admin boolean := public.current_user_is_admin(); w public.employer_wallets; content_changed boolean;
begin
  -- internal counter updates (views, application counts) skip the lifecycle rules
  if current_setting('jik.internal', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not is_admin then
      if new.status not in ('draft','pending_review') then new.status := 'draft'; end if;
      new.featured := false; new.views := 0; new.applications_count := 0; new.credit_used := false;
      new.published_at := null; new.reviewed_at := null; new.reviewed_by := null; new.rejection_reason := null;
    end if;
    if new.company_id is null then
      select c.id into new.company_id from public.companies c where c.id = new.employer_id;
    end if;
    if new.status = 'published' then
      new.published_at := now(); new.reviewed_at := now(); new.reviewed_by := auth.uid();
      new.expires_at := coalesce(new.expires_at, now() + interval '30 days');
    end if;
  else
    -- protected counters
    if auth.uid() is not null and not is_admin then
      new.views := old.views; new.applications_count := old.applications_count; new.featured := old.featured;
      new.credit_used := old.credit_used; new.reviewed_by := old.reviewed_by; new.reviewed_at := old.reviewed_at;
      new.published_at := old.published_at; new.rejection_reason := old.rejection_reason;
      new.expires_at := old.expires_at; new.employer_id := old.employer_id;
    end if;

    content_changed := (new.title, new.description, new.category, new.requirements, new.salary_min, new.salary_max, new.skills, new.employment_type, new.area_id)
      is distinct from (old.title, old.description, old.category, old.requirements, old.salary_min, old.salary_max, old.skills, old.employment_type, old.area_id);

    if auth.uid() is not null and not is_admin then
      if old.status = 'published' and new.status = 'published' and content_changed then
        new.status := 'pending_review';
      end if;
      if new.status is distinct from old.status then
        if not (
          (old.status = 'draft' and new.status = 'pending_review') or
          (old.status = 'rejected' and new.status in ('pending_review','draft')) or
          (old.status = 'published' and new.status in ('closed','pending_review')) or
          (old.status = 'pending_review' and new.status = 'draft') or
          (old.status = 'closed' and new.status = 'published' and old.published_at is not null and (old.expires_at is null or old.expires_at > now()))
        ) then
          raise exception 'This job cannot move from % to %', replace(old.status,'_',' '), replace(new.status,'_',' ');
        end if;
      end if;
    elsif new.status is distinct from old.status then
      if new.status = 'rejected' and coalesce(trim(new.rejection_reason),'') = '' then
        raise exception 'Add a reason so the employer can fix the job post';
      end if;
      if new.status = 'published' then
        new.reviewed_by := auth.uid(); new.reviewed_at := now(); new.rejection_reason := null;
        if old.published_at is null then new.published_at := now(); end if;
        if new.expires_at is null or new.expires_at <= now() then
          select * into w from public.employer_wallets where employer_id = new.employer_id;
          new.expires_at := now() + make_interval(days => coalesce(w.job_duration_days, 30));
        end if;
      elsif new.status = 'rejected' then
        new.reviewed_by := auth.uid(); new.reviewed_at := now();
      end if;
    end if;

    -- First submission consumes one posting credit.
    if new.status = 'pending_review' and old.status is distinct from 'pending_review' then
      new.submitted_at := now();
    end if;
  end if;

  if new.status = 'pending_review' and not new.credit_used and not is_admin and auth.uid() is not null then
    perform public.ensure_employer_wallet(new.employer_id);
    select * into w from public.employer_wallets where employer_id = new.employer_id for update;
    if w.job_credits < 1 or not public.wallet_usable(w) then
      raise exception 'You have no job posting credits left. Buy a plan to submit this job.';
    end if;
    update public.employer_wallets set job_credits = job_credits - 1, updated_at = now() where employer_id = new.employer_id;
    insert into public.credit_ledger(employer_id, job_delta, reason, ref_id, actor_id)
      values (new.employer_id, -1, 'Job submitted: ' || new.title, new.id, auth.uid());
    new.credit_used := true;
    if tg_op = 'INSERT' then new.submitted_at := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists job_lifecycle on public.jobs;
create trigger job_lifecycle before insert or update on public.jobs for each row execute procedure public.job_lifecycle();

create or replace function public.notify_job_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and public.current_user_is_admin() and new.employer_id <> auth.uid() then
    if new.status = 'published' then
      insert into public.notifications(user_id,kind,title,body,href,job_id)
        values(new.employer_id,'job_review','Job approved',new.title || ' is now live on Jobs in Kolar.','/employer/jobs/' || new.id,new.id);
    elsif new.status = 'rejected' then
      insert into public.notifications(user_id,kind,title,body,href,job_id)
        values(new.employer_id,'job_review','Job needs changes',new.title || ': ' || coalesce(new.rejection_reason,''),'/employer/jobs/' || new.id,new.id);
    elsif new.status = 'closed' then
      insert into public.notifications(user_id,kind,title,body,href,job_id)
        values(new.employer_id,'job_review','Job closed by moderator',new.title || ' was closed by the moderation team.','/employer/jobs/' || new.id,new.id);
    end if;
    insert into public.admin_actions(admin_id,target_type,target_id,action,reason)
      values(auth.uid(),'job',new.id,new.status,new.rejection_reason);
  end if;
  return new;
end $$;

drop policy if exists "Employers delete own jobs" on public.jobs;
create policy "Employers delete own drafts" on public.jobs for delete
  using (public.current_user_is_admin() or (employer_id = auth.uid() and status = 'draft'));

-- Public job visibility: published and not expired.
drop policy if exists "Published jobs are public" on public.jobs;
create policy "Published jobs are public" on public.jobs for select using (
  (status = 'published' and (expires_at is null or expires_at > now()))
  or employer_id = auth.uid() or public.current_user_is_admin()
);

create or replace function public.increment_job_view(p_job uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('jik.internal','1',true);
  update public.jobs set views = views + 1 where id = p_job and status = 'published';
  perform set_config('jik.internal','',true);
end $$;
grant execute on function public.increment_job_view(uuid) to anon, authenticated;

------------------------------------------------------------------------------
-- 5. Applications pipeline
------------------------------------------------------------------------------
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('submitted','reviewing','shortlisted','interview','offered','hired','rejected','withdrawn'));
alter table public.applications add column if not exists screening_answers jsonb not null default '[]'::jsonb;
alter table public.applications add column if not exists interview_at timestamptz;
alter table public.applications add column if not exists interview_mode text check (interview_mode is null or interview_mode in ('in_person','phone','video'));
alter table public.applications add column if not exists interview_location text;
alter table public.applications add column if not exists interview_note text;
alter table public.applications add column if not exists employer_id uuid references public.profiles(id) on delete cascade;
alter table public.applications add column if not exists candidate_snapshot jsonb not null default '{}'::jsonb;
alter table public.applications add column if not exists viewed_at timestamptz;
create index if not exists applications_employer_idx on public.applications(employer_id, created_at desc);

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists application_events_idx on public.application_events(application_id, created_at);

create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists application_notes_idx on public.application_notes(application_id, created_at desc);

create or replace function public.application_before() returns trigger
language plpgsql security definer set search_path = '' as $$
declare j public.jobs; p public.profiles; uid uuid := auth.uid(); is_admin boolean := public.current_user_is_admin();
begin
  if tg_op = 'INSERT' then
    select * into j from public.jobs where id = new.job_id;
    if j.id is null or j.status <> 'published' or (j.expires_at is not null and j.expires_at <= now()) then
      raise exception 'This job is no longer accepting applications';
    end if;
    if j.deadline is not null and j.deadline < current_date then
      raise exception 'The application deadline for this job has passed';
    end if;
    select * into p from public.profiles where id = new.candidate_id;
    new.employer_id := j.employer_id;
    new.status := 'submitted';
    new.resume_path := coalesce(new.resume_path, p.resume_path);
    new.interview_at := null; new.interview_mode := null; new.interview_location := null; new.interview_note := null;
    new.viewed_at := null;
    new.candidate_snapshot := jsonb_build_object(
      'full_name', p.full_name, 'headline', coalesce(p.current_title, p.headline), 'experience_years', p.experience_years,
      'location', coalesce(p.location, p.taluk), 'skills', to_jsonb(p.skills));
    if jsonb_array_length(coalesce(j.screening_questions,'[]'::jsonb)) > 0 and
       jsonb_array_length(coalesce(new.screening_answers,'[]'::jsonb)) < jsonb_array_length(j.screening_questions) then
      raise exception 'Answer all screening questions to apply';
    end if;
    return new;
  end if;

  -- UPDATE
  new.job_id := old.job_id; new.candidate_id := old.candidate_id; new.employer_id := old.employer_id;
  if new.status is distinct from old.status then
    if old.status in ('hired','withdrawn') then
      raise exception 'This application is closed';
    end if;
    if uid = old.candidate_id and not is_admin then
      if new.status <> 'withdrawn' then raise exception 'You can only withdraw your application'; end if;
    elsif uid = old.employer_id or is_admin then
      if new.status = 'withdrawn' then raise exception 'Only the candidate can withdraw an application'; end if;
      if new.status = 'interview' and new.interview_at is null then
        raise exception 'Choose an interview date and time';
      end if;
    elsif uid is not null then
      raise exception 'Not allowed';
    end if;
  end if;
  if uid = old.candidate_id and not is_admin then
    new.interview_at := old.interview_at; new.interview_mode := old.interview_mode;
    new.interview_location := old.interview_location; new.interview_note := old.interview_note; new.viewed_at := old.viewed_at;
  end if;
  if uid = old.employer_id and old.viewed_at is null and new.viewed_at is null then
    new.viewed_at := now();
  end if;
  if uid = old.employer_id and old.status = 'submitted' and new.status = 'submitted' then
    new.status := 'reviewing';
  end if;
  return new;
end $$;
drop trigger if exists application_before on public.applications;
create trigger application_before before insert or update on public.applications for each row execute procedure public.application_before();

create or replace function public.application_after() returns trigger
language plpgsql security definer set search_path = '' as $$
declare j public.jobs; cand text; msg text;
begin
  select * into j from public.jobs where id = new.job_id;
  if tg_op = 'INSERT' then
    perform set_config('jik.internal','1',true);
    update public.jobs set applications_count = applications_count + 1 where id = new.job_id;
    perform set_config('jik.internal','',true);
    insert into public.application_events(application_id, to_status, actor_id) values (new.id, 'submitted', new.candidate_id);
    select coalesce(nullif(full_name,''),'A candidate') into cand from public.profiles where id = new.candidate_id;
    insert into public.notifications(user_id,kind,title,body,href,job_id)
      values (new.employer_id, 'new_application', 'New application', cand || ' applied for ' || j.title, '/employer/applications/' || new.id, new.job_id);
    return new;
  end if;
  if new.status is distinct from old.status then
    insert into public.application_events(application_id, from_status, to_status, actor_id, note)
      values (new.id, old.status, new.status, auth.uid(), case when new.status='interview' then new.interview_note end);
    if new.status = 'withdrawn' then
      perform set_config('jik.internal','1',true);
      update public.jobs set applications_count = greatest(0, applications_count - 1) where id = new.job_id;
      perform set_config('jik.internal','',true);
      insert into public.notifications(user_id,kind,title,body,href,job_id)
        values (new.employer_id, 'application_status', 'Application withdrawn', 'A candidate withdrew from ' || j.title, '/employer/applications/' || new.id, new.job_id);
    else
      msg := case new.status
        when 'reviewing' then 'is being reviewed by ' || j.company_name
        when 'shortlisted' then 'has been shortlisted by ' || j.company_name
        when 'interview' then 'moved to interview on ' || to_char(new.interview_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM')
        when 'offered' then 'received an offer from ' || j.company_name
        when 'hired' then 'was successful. Congratulations!'
        when 'rejected' then 'was not taken forward this time'
        else 'was updated' end;
      insert into public.notifications(user_id,kind,title,body,href,job_id)
        values (new.candidate_id, case when new.status='interview' then 'interview' else 'application_status' end,
          case new.status when 'interview' then 'Interview scheduled' when 'offered' then 'Job offer' when 'hired' then 'You are hired' else 'Application update' end,
          'Your application for ' || j.title || ' ' || msg || '.', '/candidate/applications/' || new.id, new.job_id);
    end if;
  elsif new.interview_at is distinct from old.interview_at and new.status = 'interview' then
    insert into public.notifications(user_id,kind,title,body,href,job_id)
      values (new.candidate_id, 'interview', 'Interview rescheduled',
        j.title || ': now on ' || to_char(new.interview_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || '.', '/candidate/applications/' || new.id, new.job_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_candidate_application_status on public.applications;
drop trigger if exists application_after on public.applications;
create trigger application_after after insert or update on public.applications for each row execute procedure public.application_after();

update public.applications a set employer_id = j.employer_id from public.jobs j where j.id = a.job_id and a.employer_id is null;

drop policy if exists "Candidates and admins view applications" on public.applications;
create policy "Participants view applications" on public.applications for select
  using (candidate_id = auth.uid() or employer_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "Admins update application status" on public.applications;
drop policy if exists "Participants update applications" on public.applications;
create policy "Participants update applications" on public.applications for update
  using ((candidate_id = auth.uid() or employer_id = auth.uid()) and public.current_user_active() or public.current_user_is_admin())
  with check (candidate_id = auth.uid() or employer_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "Candidates apply to published jobs" on public.applications;
create policy "Candidates apply to published jobs" on public.applications for insert
  with check (
    candidate_id = auth.uid() and exists(
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'candidate' and p.account_status = 'active' and p.is_admin = false
    )
  );
revoke update on public.applications from authenticated;
grant update(status, interview_at, interview_mode, interview_location, interview_note, viewed_at) on public.applications to authenticated;

------------------------------------------------------------------------------
-- 6. Messages (per application, employer <-> candidate)
------------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_app_idx on public.messages(application_id, created_at);

create or replace function public.can_message(p_app uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.applications a
    where a.id = p_app and a.status not in ('withdrawn')
      and (
        a.employer_id = auth.uid()
        or (a.candidate_id = auth.uid() and (
              a.status in ('shortlisted','interview','offered','hired')
              or exists(select 1 from public.messages m where m.application_id = a.id and m.sender_id = a.employer_id)))
      )
  ) and public.current_user_active()
$$;

create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a public.applications; j public.jobs; recipient uuid; sender text;
begin
  select * into a from public.applications where id = new.application_id;
  select * into j from public.jobs where id = a.job_id;
  recipient := case when new.sender_id = a.employer_id then a.candidate_id else a.employer_id end;
  sender := case when new.sender_id = a.employer_id then j.company_name
    else coalesce((select nullif(full_name,'') from public.profiles where id = new.sender_id), 'Candidate') end;
  -- one unread message notification per thread is enough
  if not exists(select 1 from public.notifications n where n.user_id = recipient and n.kind = 'message'
                and n.read_at is null and n.href like '%' || a.id::text) then
    insert into public.notifications(user_id,kind,title,body,href,job_id)
      values(recipient,'message','New message from ' || sender, left(new.body, 140),
        case when recipient = a.employer_id then '/employer/messages?thread=' else '/candidate/messages?thread=' end || a.id, a.job_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_message on public.messages;
create trigger notify_message after insert on public.messages for each row execute procedure public.notify_message();

------------------------------------------------------------------------------
-- 7. Talent pool: search + credit-based unlock
------------------------------------------------------------------------------
create table if not exists public.candidate_unlocks (
  employer_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (employer_id, candidate_id)
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.employer_can_see_contact(p_candidate uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.current_user_is_admin()
    or exists(select 1 from public.candidate_unlocks u where u.employer_id = auth.uid() and u.candidate_id = p_candidate)
    or exists(select 1 from public.applications a where a.employer_id = auth.uid() and a.candidate_id = p_candidate and a.status <> 'withdrawn')
$$;

create or replace function public.search_talent(
  p_query text default null, p_taluk text default null, p_min_exp integer default null, p_max_exp integer default null,
  p_availability text default null, p_category text default null, p_unlocked_only boolean default false,
  p_limit integer default 20, p_offset integer default 0
) returns table(
  id uuid, display_name text, current_title text, experience_years integer, education text, taluk text, location text,
  skills text[], languages text[], expected_salary integer, availability text, preferred_categories text[],
  has_resume boolean, verified_docs integer, last_active_at timestamptz, unlocked boolean, total_count bigint
) language plpgsql stable security definer set search_path = '' as $$
begin
  if public.current_user_role() not in ('employer','admin') or not public.current_user_active() then
    raise exception 'Employer account required';
  end if;
  return query
  with base as (
    select p.*, exists(select 1 from public.candidate_unlocks u where u.employer_id = auth.uid() and u.candidate_id = p.id)
      or exists(select 1 from public.applications a where a.employer_id = auth.uid() and a.candidate_id = p.id and a.status <> 'withdrawn') as is_unlocked
    from public.profiles p
    where p.role = 'candidate' and not p.is_admin and p.account_status = 'active'
      and p.talent_visible and length(trim(p.full_name)) > 0
      and (p_taluk is null or p.taluk = p_taluk)
      and (p_min_exp is null or coalesce(p.experience_years,0) >= p_min_exp)
      and (p_max_exp is null or coalesce(p.experience_years,0) <= p_max_exp)
      and (p_availability is null or p.availability = p_availability)
      and (p_category is null or p_category = any(p.preferred_categories))
      and (p_query is null or trim(p_query) = '' or
           (coalesce(p.current_title,'') || ' ' || coalesce(p.headline,'') || ' ' || array_to_string(p.skills,' ') || ' ' || coalesce(p.education,''))
             ilike '%' || trim(p_query) || '%')
  )
  select b.id,
    case when b.is_unlocked then b.full_name
      else split_part(trim(b.full_name),' ',1) || coalesce(' ' || nullif(left(split_part(trim(b.full_name),' ',2),1),'') || '.','') end,
    coalesce(b.current_title, b.headline), b.experience_years, b.education, b.taluk, b.location,
    b.skills, b.languages, b.expected_salary, b.availability, b.preferred_categories,
    b.resume_path is not null,
    (select count(*)::int from public.candidate_documents d where d.candidate_id = b.id and d.status = 'verified'),
    b.last_active_at, b.is_unlocked, count(*) over()
  from base b
  where (not p_unlocked_only or b.is_unlocked)
  order by b.open_to_work desc, b.last_active_at desc
  limit least(greatest(p_limit,1),50) offset greatest(p_offset,0);
end $$;
grant execute on function public.search_talent(text,text,integer,integer,text,text,boolean,integer,integer) to authenticated;

create or replace function public.unlock_candidate(p_candidate uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare w public.employer_wallets;
begin
  if public.current_user_role() <> 'employer' or not public.current_user_active() then
    raise exception 'Employer account required';
  end if;
  if public.employer_can_see_contact(p_candidate) then return true; end if;
  if not exists(select 1 from public.profiles p where p.id = p_candidate and p.role='candidate' and p.talent_visible and p.account_status='active') then
    raise exception 'This profile is not available';
  end if;
  if not exists(select 1 from public.companies c where c.id = auth.uid() and c.verified) then
    raise exception 'Your company must be verified by the Jobs in Kolar team before unlocking candidates.';
  end if;
  perform public.ensure_employer_wallet(auth.uid());
  select * into w from public.employer_wallets where employer_id = auth.uid() for update;
  if w.unlock_credits < 1 or not public.wallet_usable(w) then
    raise exception 'No profile unlock credits left. Buy a plan to unlock more candidates.';
  end if;
  update public.employer_wallets set unlock_credits = unlock_credits - 1, updated_at = now() where employer_id = auth.uid();
  insert into public.candidate_unlocks(employer_id, candidate_id) values (auth.uid(), p_candidate);
  insert into public.credit_ledger(employer_id, unlock_delta, reason, ref_id, actor_id)
    values (auth.uid(), -1, 'Candidate profile unlocked', p_candidate, auth.uid());
  insert into public.notifications(user_id, kind, title, body, href)
    values (p_candidate, 'system', 'An employer viewed your profile',
      coalesce((select c.name from public.companies c where c.id = auth.uid()), 'An employer') || ' unlocked your contact details from the talent pool.', '/candidate');
  return true;
end $$;
grant execute on function public.unlock_candidate(uuid) to authenticated;

-- Full candidate view for an employer (contact only when applied/unlocked) or admin.
create or replace function public.candidate_card(p_candidate uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare p public.profiles; can_contact boolean; visible boolean;
begin
  select * into p from public.profiles where id = p_candidate and role = 'candidate';
  if p.id is null then return null; end if;
  can_contact := public.employer_can_see_contact(p_candidate) or auth.uid() = p_candidate;
  visible := can_contact or (public.current_user_role() = 'employer' and p.talent_visible and p.account_status = 'active');
  if not visible then raise exception 'This profile is not available'; end if;
  return jsonb_build_object(
    'id', p.id,
    'full_name', case when can_contact then p.full_name else split_part(trim(p.full_name),' ',1) end,
    'email', case when can_contact then p.email end,
    'phone', case when can_contact then p.phone end,
    'headline', coalesce(p.current_title, p.headline), 'bio', p.bio, 'skills', to_jsonb(p.skills),
    'languages', to_jsonb(p.languages), 'experience_years', p.experience_years, 'education', p.education,
    'expected_salary', p.expected_salary, 'availability', p.availability, 'taluk', p.taluk, 'location', p.location,
    'resume_path', case when can_contact then p.resume_path end, 'unlocked', can_contact, 'last_active_at', p.last_active_at,
    'experiences', coalesce((select jsonb_agg(to_jsonb(e) - 'candidate_id' order by e.start_date desc) from public.candidate_experiences e where e.candidate_id = p.id), '[]'::jsonb),
    'documents', case when can_contact then coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'kind',d.kind,'file_name',d.file_name,'file_path',d.file_path,'status',d.status) order by d.created_at desc)
        from public.candidate_documents d where d.candidate_id = p.id and d.status <> 'rejected'), '[]'::jsonb) else '[]'::jsonb end
  );
end $$;
grant execute on function public.candidate_card(uuid) to authenticated;

------------------------------------------------------------------------------
-- 8. Notifications, audit, contact
------------------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('profile_status','application_status','new_job','new_application','job_review','message','interview','credits','document','company','system'));

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  target_type text not null,
  target_id uuid,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists admin_actions_idx on public.admin_actions(created_at desc);

drop trigger if exists notify_job_review on public.jobs;
create trigger notify_job_review after update of status on public.jobs for each row execute procedure public.notify_job_review();

create or replace function public.notify_document_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.reviewed_by := null; new.reviewed_at := null; new.review_note := null;
    elsif (new.status, new.review_note, new.reviewed_by) is distinct from (old.status, old.review_note, old.reviewed_by) then
      raise exception 'Documents are verified by the Jobs in Kolar team';
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.reviewed_by := auth.uid(); new.reviewed_at := now();
    if new.status = 'rejected' and coalesce(trim(new.review_note),'') = '' then
      raise exception 'Add a note explaining why the document was rejected';
    end if;
    insert into public.notifications(user_id,kind,title,body,href)
      values(new.candidate_id,'document',
        case when new.status='verified' then 'Document verified' else 'Document not accepted' end,
        new.file_name || case when new.status='verified' then ' has been verified.' else ': ' || new.review_note end,
        '/candidate/documents');
    insert into public.admin_actions(admin_id,target_type,target_id,action,reason) values(auth.uid(),'document',new.id,new.status,new.review_note);
  end if;
  return new;
end $$;
drop trigger if exists document_review on public.candidate_documents;
create trigger document_review before insert or update on public.candidate_documents for each row execute procedure public.notify_document_review();

create or replace function public.notify_company_verified() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.verified is distinct from old.verified then
    insert into public.notifications(user_id,kind,title,body,href)
      values(new.id,'company', case when new.verified then 'Company verified' else 'Verification removed' end,
        case when new.verified then new.name || ' now shows a verified badge on every job.' else 'Contact support to restore verification.' end, '/employer/company');
    insert into public.admin_actions(admin_id,target_type,target_id,action) values(auth.uid(),'company',new.id,case when new.verified then 'verify' else 'unverify' end);
  end if;
  return new;
end $$;
drop trigger if exists notify_company_verified on public.companies;
create trigger notify_company_verified after update of verified on public.companies for each row execute procedure public.notify_company_verified();

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 100),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  topic text not null default 'general',
  message text not null check (length(trim(message)) between 10 and 3000),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

------------------------------------------------------------------------------
-- 9. Role sync into the JWT (app_metadata.role) for edge routing
------------------------------------------------------------------------------
create or replace function public.sync_role_claim() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb)
    || jsonb_build_object('role', case when new.is_admin then 'admin' else new.role end)
  where id = new.id;
  if new.role = 'employer' then perform public.ensure_employer_wallet(new.id); end if;
  return new;
end $$;
drop trigger if exists sync_role_claim on public.profiles;
create trigger sync_role_claim after insert or update of role, is_admin on public.profiles
  for each row execute procedure public.sync_role_claim();
update auth.users u set raw_app_meta_data = coalesce(u.raw_app_meta_data,'{}'::jsonb)
  || jsonb_build_object('role', case when p.is_admin then 'admin' else p.role end)
  from public.profiles p where p.id = u.id;

-- Signup: also store phone and create the company shell for employers.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r text := case when new.raw_user_meta_data->>'role' = 'employer' then 'employer' else 'candidate' end;
  cname text := nullif(trim(new.raw_user_meta_data->>'company_name'),''); base_slug text;
begin
  insert into public.profiles(id,email,full_name,role,phone,company_name)
  values(new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'full_name',''), r,
    nullif(trim(new.raw_user_meta_data->>'phone'),''), cname)
  on conflict(id) do update set email = excluded.email;
  if r = 'employer' then
    base_slug := trim(both '-' from regexp_replace(lower(coalesce(cname, 'company')), '[^a-z0-9]+', '-', 'g'));
    insert into public.companies(id, name, slug)
      values (new.id, coalesce(cname, 'My company'), coalesce(nullif(base_slug,''),'company') || '-' || substr(new.id::text,1,6))
      on conflict(id) do nothing;
    insert into public.company_private(id, contact_name, contact_phone, contact_email)
      values (new.id, nullif(new.raw_user_meta_data->>'full_name',''), nullif(trim(new.raw_user_meta_data->>'phone'),''), lower(new.email))
      on conflict(id) do nothing;
  end if;
  return new;
end $$;

------------------------------------------------------------------------------
-- 10. Public directory + stats
------------------------------------------------------------------------------
create or replace view public.company_directory with (security_invoker = false) as
  select c.id, c.name, c.slug, c.logo_path, c.industry, c.company_size, c.website, c.about, c.taluk, c.verified, c.created_at,
    (select count(*) from public.jobs j where j.company_id = c.id and j.status = 'published' and (j.expires_at is null or j.expires_at > now()))::int as open_jobs
  from public.companies c
  join public.profiles p on p.id = c.id and p.account_status = 'active';
grant select on public.company_directory to anon, authenticated;

create or replace function public.public_stats() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'live_jobs', (select count(*) from public.jobs where status='published' and (expires_at is null or expires_at > now())),
    'openings', (select coalesce(sum(openings),0) from public.jobs where status='published' and (expires_at is null or expires_at > now())),
    'companies', (select count(distinct company_name) from public.jobs where status='published'),
    'candidates', (select count(*) from public.profiles where role='candidate' and not is_admin),
    'hires', (select count(*) from public.applications where status='hired'),
    'by_category', (select coalesce(jsonb_object_agg(category, n),'{}'::jsonb) from (
        select category, count(*) n from public.jobs where status='published' and (expires_at is null or expires_at > now()) group by category) s),
    'by_taluk', (select coalesce(jsonb_object_agg(taluk, n),'{}'::jsonb) from (
        select taluk, count(*) n from public.jobs where status='published' and taluk is not null and (expires_at is null or expires_at > now()) group by taluk) s)
  )
$$;
grant execute on function public.public_stats() to anon, authenticated;

create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'Administrator access required'; end if;
  return jsonb_build_object(
    'candidates', (select count(*) from public.profiles where role='candidate' and not is_admin),
    'employers', (select count(*) from public.profiles where role='employer'),
    'live_jobs', (select count(*) from public.jobs where status='published' and (expires_at is null or expires_at > now())),
    'pending_jobs', (select count(*) from public.jobs where status='pending_review'),
    'applications', (select count(*) from public.applications),
    'applications_7d', (select count(*) from public.applications where created_at > now() - interval '7 days'),
    'hires', (select count(*) from public.applications where status='hired'),
    'pending_documents', (select count(*) from public.candidate_documents where status='pending'),
    'unverified_companies', (select count(*) from public.companies where not verified),
    'pending_areas', (select count(*) from public.area_suggestions where status='pending'),
    'open_messages', (select count(*) from public.contact_messages where status='open'),
    'revenue_inr', (select coalesce(sum(total_inr),0) from public.payment_orders where status='paid'),
    'signups_14d', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'candidates', c, 'employers', e) order by d),'[]'::jsonb) from (
        select d, (select count(*) from public.profiles p where p.created_at::date = d::date and p.role='candidate') c,
                  (select count(*) from public.profiles p where p.created_at::date = d::date and p.role='employer') e
        from generate_series(current_date - 13, current_date, interval '1 day') d) s)
  );
end $$;
grant execute on function public.admin_overview() to authenticated;

------------------------------------------------------------------------------
-- 11. RLS for new tables + profile column grants
------------------------------------------------------------------------------
alter table public.candidate_experiences enable row level security;
alter table public.candidate_documents enable row level security;
alter table public.companies enable row level security;
alter table public.company_private enable row level security;
alter table public.plans enable row level security;
alter table public.employer_wallets enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.payment_orders enable row level security;
alter table public.application_events enable row level security;
alter table public.application_notes enable row level security;
alter table public.messages enable row level security;
alter table public.candidate_unlocks enable row level security;
alter table public.saved_searches enable row level security;
alter table public.admin_actions enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "own experiences" on public.candidate_experiences;
create policy "own experiences" on public.candidate_experiences for all
  using (candidate_id = auth.uid() or public.current_user_is_admin())
  with check (candidate_id = auth.uid() and public.current_user_active());

drop policy if exists "own documents read" on public.candidate_documents;
create policy "own documents read" on public.candidate_documents for select
  using (candidate_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "own documents insert" on public.candidate_documents;
create policy "own documents insert" on public.candidate_documents for insert
  with check (candidate_id = auth.uid() and public.current_user_active());
drop policy if exists "own documents delete" on public.candidate_documents;
create policy "own documents delete" on public.candidate_documents for delete
  using (candidate_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "admin documents update" on public.candidate_documents;
create policy "admin documents update" on public.candidate_documents for update
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

drop policy if exists "companies read" on public.companies;
create policy "companies read" on public.companies for select using (true);
drop policy if exists "companies owner update" on public.companies;
create policy "companies owner update" on public.companies for update
  using ((id = auth.uid() and public.current_user_active()) or public.current_user_is_admin())
  with check (id = auth.uid() or public.current_user_is_admin());
drop policy if exists "companies owner insert" on public.companies;
create policy "companies owner insert" on public.companies for insert
  with check (id = auth.uid() and public.current_user_role() = 'employer');

drop policy if exists "company private owner" on public.company_private;
create policy "company private owner" on public.company_private for all
  using (id = auth.uid() or public.current_user_is_admin())
  with check (id = auth.uid() or public.current_user_is_admin());

drop policy if exists "plans public" on public.plans;
create policy "plans public" on public.plans for select using (active or public.current_user_is_admin());
drop policy if exists "plans admin" on public.plans;
create policy "plans admin" on public.plans for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

drop policy if exists "wallet owner read" on public.employer_wallets;
create policy "wallet owner read" on public.employer_wallets for select using (employer_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "ledger owner read" on public.credit_ledger;
create policy "ledger owner read" on public.credit_ledger for select using (employer_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "orders owner read" on public.payment_orders;
create policy "orders owner read" on public.payment_orders for select using (employer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "events participants" on public.application_events;
create policy "events participants" on public.application_events for select using (
  exists(select 1 from public.applications a where a.id = application_id and (a.candidate_id = auth.uid() or a.employer_id = auth.uid()))
  or public.current_user_is_admin());

drop policy if exists "notes employer" on public.application_notes;
create policy "notes employer" on public.application_notes for all using (
  exists(select 1 from public.applications a where a.id = application_id and a.employer_id = auth.uid()) or public.current_user_is_admin()
) with check (author_id = auth.uid() and (
  exists(select 1 from public.applications a where a.id = application_id and a.employer_id = auth.uid()) or public.current_user_is_admin()));

drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select using (
  exists(select 1 from public.applications a where a.id = application_id and (a.candidate_id = auth.uid() or a.employer_id = auth.uid()))
  or public.current_user_is_admin());
drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert with check (sender_id = auth.uid() and public.can_message(application_id));
drop policy if exists "messages mark read" on public.messages;
create policy "messages mark read" on public.messages for update using (
  sender_id <> auth.uid() and exists(select 1 from public.applications a where a.id = application_id and (a.candidate_id = auth.uid() or a.employer_id = auth.uid())));
revoke update on public.messages from authenticated;
grant update(read_at) on public.messages to authenticated;

drop policy if exists "unlocks owner" on public.candidate_unlocks;
create policy "unlocks owner" on public.candidate_unlocks for select using (employer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "saved searches owner" on public.saved_searches;
create policy "saved searches owner" on public.saved_searches for all using (employer_id = auth.uid()) with check (employer_id = auth.uid());

drop policy if exists "admin actions read" on public.admin_actions;
create policy "admin actions read" on public.admin_actions for select using (public.current_user_is_admin());

drop policy if exists "contact insert" on public.contact_messages;
create policy "contact insert" on public.contact_messages for insert with check (status = 'open');
drop policy if exists "contact admin" on public.contact_messages;
create policy "contact admin" on public.contact_messages for select using (public.current_user_is_admin());
drop policy if exists "contact admin update" on public.contact_messages;
create policy "contact admin update" on public.contact_messages for update using (public.current_user_is_admin()) with check (public.current_user_is_admin());

-- Area suggestions and newsletter rows visible to admins.
drop policy if exists "Admins read newsletter" on public.newsletter_subscribers;
create policy "Admins read newsletter" on public.newsletter_subscribers for select using (public.current_user_is_admin());

revoke update on public.profiles from authenticated;
grant update(full_name,phone,headline,bio,skills,resume_path,company_name,company_website,company_description,location,
  current_title,experience_years,education,expected_salary,availability,languages,taluk,open_to_work,talent_visible,
  preferred_categories,last_active_at,account_status,interest_status,admin_status_updated_at,admin_status_updated_by,role,is_admin)
  on public.profiles to authenticated;
-- role/is_admin remain protected by protect_profile_admin_fields (non-admins raise).

------------------------------------------------------------------------------
-- 12. Storage
------------------------------------------------------------------------------
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp']
  where id = 'candidate-files';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('company-logos','company-logos',true,1048576,array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict(id) do nothing;

create or replace function public.employer_can_read_file(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.profiles p
    where p.id::text = split_part(p_name,'/',1) and public.employer_can_see_contact(p.id)
  )
$$;

drop policy if exists "Employers read permitted candidate files" on storage.objects;
create policy "Employers read permitted candidate files" on storage.objects for select
  using (bucket_id = 'candidate-files' and public.current_user_role() = 'employer' and public.employer_can_read_file(name));

drop policy if exists "Logo public read" on storage.objects;
create policy "Logo public read" on storage.objects for select using (bucket_id = 'company-logos');
drop policy if exists "Logo owner write" on storage.objects;
create policy "Logo owner write" on storage.objects for insert
  with check (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Logo owner update" on storage.objects;
create policy "Logo owner update" on storage.objects for update
  using (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Logo owner delete" on storage.objects;
create policy "Logo owner delete" on storage.objects for delete
  using (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth.uid()::text);

------------------------------------------------------------------------------
-- 13. Realtime
------------------------------------------------------------------------------
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='employer_wallets') then
    alter publication supabase_realtime add table public.employer_wallets;
  end if;
end $$;

-- Existing employers (if any) get a company shell and wallet.
insert into public.companies(id, name, slug)
  select p.id, coalesce(nullif(p.company_name,''),'My company'),
    coalesce(nullif(trim(both '-' from regexp_replace(lower(coalesce(p.company_name,'company')), '[^a-z0-9]+','-','g')),''),'company') || '-' || substr(p.id::text,1,6)
  from public.profiles p where p.role = 'employer'
  on conflict(id) do nothing;
select public.ensure_employer_wallet(p.id) from public.profiles p where p.role = 'employer';
