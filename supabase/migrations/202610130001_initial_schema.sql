-- Jobs in Kolar initial schema. Apply with `supabase db push` after linking the project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'candidate' check (role in ('candidate','employer','admin')),
  phone text,
  headline text,
  bio text,
  skills text[] not null default '{}',
  resume_path text,
  company_name text,
  company_website text,
  company_description text,
  location text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  company_name text not null,
  category text not null,
  employment_type text not null default 'Full-time' check (employment_type in ('Full-time','Part-time','Contract','Temporary','Internship')),
  experience_level text,
  location text not null default 'Kolar, Karnataka',
  salary_min integer check (salary_min is null or salary_min >= 0),
  salary_max integer check (salary_max is null or salary_max >= salary_min),
  description text not null,
  requirements text[] not null default '{}',
  status text not null default 'pending_review' check (status in ('draft','pending_review','published','closed','rejected')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  cover_letter text,
  resume_path text,
  status text not null default 'submitted' check (status in ('submitted','reviewing','shortlisted','rejected','hired','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id,candidate_id)
);

create table if not exists public.saved_jobs (
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(candidate_id,job_id)
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.area_suggestions (
  id uuid primary key default gen_random_uuid(),
  taluk text not null,
  area_name text not null,
  pincode text not null check (pincode ~ '^[0-9]{6}$'),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  taluk text not null,
  pincode text check (pincode is null or pincode ~ '^[0-9]{6}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists jobs_search_idx on public.jobs(status, created_at desc);
create index if not exists jobs_category_idx on public.jobs(category);
create index if not exists jobs_location_idx on public.jobs(location);
create index if not exists applications_candidate_idx on public.applications(candidate_id, created_at desc);
create index if not exists applications_job_idx on public.applications(job_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at before update on public.applications for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, role)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name',''),
    case when new.raw_user_meta_data->>'role' = 'employer' then 'employer' else 'candidate' end);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Security-definer helpers prevent circular RLS checks for cross-table employer/admin access.
create or replace function public.current_user_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;
create or replace function public.can_employer_view_candidate(candidate_profile_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.candidate_id = candidate_profile_id and j.employer_id = auth.uid()
  )
$$;
create or replace function public.prevent_non_admin_job_status_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and new.status is distinct from old.status and not public.current_user_is_admin() then
    raise exception 'Only an administrator can change job publication status';
  end if;
  return new;
end $$;
drop trigger if exists protect_job_publication_status on public.jobs;
create trigger protect_job_publication_status before update on public.jobs for each row execute procedure public.prevent_non_admin_job_status_change();

alter table public.profiles enable row level security;
alter table public.job_categories enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.area_suggestions enable row level security;
alter table public.areas enable row level security;

drop policy if exists "Public profiles readable" on public.profiles;
create policy "Public profiles readable" on public.profiles for select using (
  id = auth.uid() or public.current_user_is_admin() or public.can_employer_view_candidate(id)
);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and is_admin = false);

drop policy if exists "Active categories are public" on public.job_categories;
create policy "Active categories are public" on public.job_categories for select using (active = true);

drop policy if exists "Published jobs are public" on public.jobs;
create policy "Published jobs are public" on public.jobs for select using (status = 'published' or employer_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "Employers create jobs" on public.jobs;
create policy "Employers create jobs" on public.jobs for insert with check (employer_id = auth.uid() and status in ('draft','pending_review') and exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employer'));
drop policy if exists "Employers update own jobs" on public.jobs;
create policy "Employers update own jobs" on public.jobs for update using (employer_id = auth.uid() or public.current_user_is_admin()) with check (employer_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "Employers delete own jobs" on public.jobs;
create policy "Employers delete own jobs" on public.jobs for delete using (employer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Candidates view own applications" on public.applications;
create policy "Candidates view own applications" on public.applications for select using (candidate_id = auth.uid() or exists(select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()) or public.current_user_is_admin());
drop policy if exists "Candidates apply to published jobs" on public.applications;
create policy "Candidates apply to published jobs" on public.applications for insert with check (candidate_id = auth.uid() and exists(select 1 from public.jobs j where j.id = job_id and j.status = 'published'));
drop policy if exists "Employers update application status" on public.applications;
create policy "Employers update application status" on public.applications for update using (exists(select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()) or public.current_user_is_admin()) with check (exists(select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()) or public.current_user_is_admin());

-- Keep account roles and application ownership fields outside self-service updates.
revoke update on public.profiles from authenticated;
grant update(full_name,phone,headline,bio,skills,resume_path,company_name,company_website,company_description,location) on public.profiles to authenticated;
revoke update on public.applications from authenticated;
grant update(status) on public.applications to authenticated;

drop policy if exists "Candidates manage saved jobs" on public.saved_jobs;
create policy "Candidates manage saved jobs" on public.saved_jobs for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;
create policy "Anyone can subscribe" on public.newsletter_subscribers for insert with check (true);
drop policy if exists "Submit area suggestions" on public.area_suggestions;
create policy "Submit area suggestions" on public.area_suggestions for insert with check (status = 'pending' and (submitted_by is null or submitted_by = auth.uid()));
drop policy if exists "Admins review area suggestions" on public.area_suggestions;
create policy "Admins review area suggestions" on public.area_suggestions for select using (public.current_user_is_admin());
drop policy if exists "Admins update area suggestions" on public.area_suggestions;
create policy "Admins update area suggestions" on public.area_suggestions for update using (public.current_user_is_admin()) with check (public.current_user_is_admin());
drop policy if exists "Active areas are public" on public.areas;
create policy "Active areas are public" on public.areas for select using (active = true);
drop policy if exists "Admins manage areas" on public.areas;
create policy "Admins manage areas" on public.areas for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

create or replace function public.add_approved_area() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    insert into public.areas(name,taluk,pincode) values(new.area_name,new.taluk,new.pincode)
    on conflict(name) do update set active = true;
  end if;
  return new;
end $$;
drop trigger if exists approved_area_insert on public.area_suggestions;
create trigger approved_area_insert after update of status on public.area_suggestions for each row execute procedure public.add_approved_area();

insert into public.areas(name,taluk) values
('Kolar','Kolar'),('Bangarapet','Bangarapet'),('Malur','Malur'),('Mulbagal','Mulbagal'),('Srinivaspur','Srinivaspur'),('KGF','Bangarapet')
on conflict(name) do nothing;

insert into public.job_categories(name,slug,description,sort_order) values
('Manufacturing','manufacturing','Industrial and production roles',1),
('Technology','technology','IT and software roles',2),
('Healthcare','healthcare','Medical and nursing roles',3),
('Education','education','Teaching and education roles',4),
('Sales','sales','Sales and customer roles',5),
('Hospitality','hospitality','Hospitality and service roles',6),
('Women Friendly','women-friendly','Flexible and inclusive opportunities',7)
on conflict(slug) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('candidate-files','candidate-files',false,5242880,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do nothing;
drop policy if exists "Users manage own candidate files" on storage.objects;
create policy "Users manage own candidate files" on storage.objects for all using (bucket_id = 'candidate-files' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'candidate-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Employers read applicant resumes" on storage.objects;
create policy "Employers read applicant resumes" on storage.objects for select using (
  bucket_id = 'candidate-files' and exists(
    select 1 from public.applications a join public.jobs j on j.id = a.job_id where a.resume_path = name and j.employer_id = auth.uid()
  )
);
