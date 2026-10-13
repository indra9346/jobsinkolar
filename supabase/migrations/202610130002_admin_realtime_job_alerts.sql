-- Admin-only candidate management, live status notifications, verified Kolar
-- regions, and job-alert subscription/outbox support.

-- Canonical Kolar district taluks from the Government of Karnataka district site.
create table if not exists public.taluks (
  name text primary key,
  district text not null default 'Kolar',
  state text not null default 'Karnataka',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.taluks(name) values
  ('Kolar'),('Malur'),('Bangarpet'),('KGF'),('Mulbagal'),('Srinivaspur')
on conflict(name) do update set active = true;

alter table public.areas add column if not exists verified boolean not null default false;
alter table public.areas add column if not exists source_name text;
alter table public.areas add column if not exists source_url text;
update public.areas set taluk = 'Bangarpet' where taluk = 'Bangarapet';
update public.area_suggestions set taluk = 'Bangarpet' where taluk = 'Bangarapet';
update public.areas set name = 'Bangarpet (Taluk)' where name = 'Bangarapet';
update public.areas set name = 'Bangarpet H.O.', verified = true,
  source_name = 'India Post, Karnataka Post Offices list',
  source_url = 'https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'
  where name = 'Bangarapet Town';
update public.areas set taluk = 'KGF' where name = 'KGF';
update public.areas set name = 'Robertsonpet', verified = true,
  source_name = 'India Post, Karnataka Post Offices list',
  source_url = 'https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'
  where name = 'Robertsonpet & BEML';
update public.areas set name = 'Narasapura', verified = true,
  source_name = 'India Post, Karnataka Post Offices list',
  source_url = 'https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'
  where name = 'Narasapura Industrial Area';
update public.areas set active = false where name in (
  'Gulpet & SNR Hospital Enclave','Vemagal Tech Hub','Malur Industrial Cluster',
  'Mulbagal Commercial Zone','Srinivaspur Horticulture Belt'
);

alter table public.areas drop constraint if exists areas_taluk_fkey;
alter table public.areas add constraint areas_taluk_fkey
  foreign key (taluk) references public.taluks(name) not valid;
alter table public.areas validate constraint areas_taluk_fkey;

insert into public.areas(name,taluk,pincode,active,verified,source_name,source_url) values
  ('Kolar H.O.','Kolar','563101',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Kolar Extension','Kolar','563102',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Tamaka','Kolar','563103',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Narasapura','Kolar','563133',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Bangarpet','Bangarpet','563114',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Andersonpet','KGF','563113',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('BEML Nagar','KGF','563115',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Bethamangala','KGF','563116',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Champion Reefs','KGF','563117',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Coromandel','KGF','563118',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Marikuppam','KGF','563119',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Oorgaum','KGF','563120',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Oorgaumpet','KGF','563121',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Malur H.O.','Malur','563130',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Mulbagal H.O.','Mulbagal','563131',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf'),
  ('Srinivaspur H.O.','Srinivaspur','563135',true,true,'India Post, Karnataka Post Offices list','https://www.indiapost.gov.in/Financial/DOP_PDFFiles/PostOfficesOnline.pdf')
on conflict(name) do update set taluk=excluded.taluk,pincode=excluded.pincode,active=true,
  verified=true,source_name=excluded.source_name,source_url=excluded.source_url;

alter table public.jobs add column if not exists taluk text references public.taluks(name);
alter table public.jobs add column if not exists area_id uuid references public.areas(id) on delete restrict;
create index if not exists jobs_taluk_area_idx on public.jobs(taluk,area_id);

create or replace function public.validate_job_kolar_area() returns trigger
language plpgsql set search_path = '' as $$
declare selected_taluk text;
begin
  if tg_op = 'INSERT' and new.area_id is null then
    raise exception 'Choose a verified Kolar district area for this job';
  end if;
  if new.area_id is not null then
    select a.taluk into selected_taluk from public.areas a
      where a.id = new.area_id and a.active = true and a.verified = true;
    if selected_taluk is null or selected_taluk is distinct from new.taluk then
      raise exception 'The selected area does not match the selected Kolar taluk';
    end if;
    new.location := (select a.name from public.areas a where a.id = new.area_id);
  elsif tg_op = 'UPDATE' and (new.area_id is distinct from old.area_id or new.taluk is distinct from old.taluk) then
    raise exception 'Choose a verified Kolar district area for this job';
  end if;
  return new;
end $$;
drop trigger if exists jobs_require_kolar_area_insert on public.jobs;
create trigger jobs_require_kolar_area_insert before insert on public.jobs
  for each row execute procedure public.validate_job_kolar_area();
drop trigger if exists jobs_require_kolar_area_update on public.jobs;
create trigger jobs_require_kolar_area_update before update of area_id,taluk on public.jobs
  for each row execute procedure public.validate_job_kolar_area();

-- Profile account and recruitment statuses are changed by admins only.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists interest_status text not null default 'new';
alter table public.profiles add column if not exists admin_status_updated_at timestamptz;
alter table public.profiles add column if not exists admin_status_updated_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add constraint profiles_account_status_check
  check (account_status in ('active','blocked','suspended')) not valid;
alter table public.profiles validate constraint profiles_account_status_check;
alter table public.profiles add constraint profiles_interest_status_check
  check (interest_status in ('new','interested','contacted','shortlisted','hired','not_interested')) not valid;
alter table public.profiles validate constraint profiles_interest_status_check;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is distinct from u.email;

-- Keep the existing auth signup flow, while syncing the email needed for account
-- alerts and admin search into the private profile row.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,full_name,role)
  values(new.id,lower(new.email),coalesce(new.raw_user_meta_data->>'full_name',''),
    case when new.raw_user_meta_data->>'role' = 'employer' then 'employer' else 'candidate' end)
  on conflict(id) do update set email=excluded.email;
  return new;
end $$;

create or replace function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;
drop trigger if exists sync_auth_email_to_profile on auth.users;
create trigger sync_auth_email_to_profile after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute procedure public.sync_profile_email();

create table if not exists public.admin_profile_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete restrict,
  note text not null check (length(trim(note)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists admin_profile_notes_profile_idx on public.admin_profile_notes(profile_id,created_at desc);
create table if not exists public.admin_profile_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete restrict,
  field_name text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);
create index if not exists admin_profile_history_profile_idx on public.admin_profile_history(profile_id,created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('profile_status','application_status','new_job')),
  title text not null,
  body text not null,
  href text,
  job_id uuid references public.jobs(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);

create table if not exists public.job_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and length(email) <= 254),
  taluk text references public.taluks(name),
  area_id uuid references public.areas(id) on delete cascade,
  category text,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default false,
  active boolean not null default true,
  consented_at timestamptz not null default now(),
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  subscription_key text generated always as
    (lower(email)||'|'||coalesce(taluk,'*')||'|'||coalesce(category,'*')||'|'||coalesce(area_id::text,'*')) stored,
  check (user_id is not null or email_enabled = true),
  constraint job_alert_subscription_key_unique unique(subscription_key)
);
create index if not exists job_alert_active_match_idx on public.job_alert_subscriptions(active,taluk,category,area_id);
create index if not exists job_alert_user_idx on public.job_alert_subscriptions(user_id) where user_id is not null;

create table if not exists public.job_alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.job_alert_subscriptions(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','sending','sent','failed','skipped')),
  attempt_count integer not null default 0,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(subscription_id,job_id)
);
create index if not exists job_alert_delivery_queue_idx on public.job_alert_deliveries(status,created_at) where status in ('queued','failed');

alter table public.admin_profile_notes enable row level security;
alter table public.admin_profile_history enable row level security;
alter table public.notifications enable row level security;
alter table public.job_alert_subscriptions enable row level security;
alter table public.job_alert_deliveries enable row level security;
alter table public.taluks enable row level security;

drop policy if exists "Public profiles readable" on public.profiles;
drop policy if exists "Profile owner or admins read profiles" on public.profiles;
create policy "Profile owner or admins read profiles" on public.profiles for select
  using (id = auth.uid() or public.current_user_is_admin());
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update
  using (id = auth.uid() and account_status = 'active')
  with check (id = auth.uid() and is_admin = false and role <> 'admin');
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles for update
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

drop policy if exists "Candidates view own applications" on public.applications;
create policy "Candidates and admins view applications" on public.applications for select
  using (candidate_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "Employers update application status" on public.applications;
drop policy if exists "Admins update application status" on public.applications;
create policy "Admins update application status" on public.applications for update
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

drop policy if exists "Employers read applicant resumes" on storage.objects;
drop policy if exists "Admins read candidate files" on storage.objects;
create policy "Admins read candidate files" on storage.objects for select
  using (bucket_id='candidate-files' and public.current_user_is_admin());

drop policy if exists "Admins create jobs" on public.jobs;
create policy "Admins create jobs" on public.jobs for insert
  with check (public.current_user_is_admin());

drop policy if exists "Admins read profile notes" on public.admin_profile_notes;
create policy "Admins read profile notes" on public.admin_profile_notes for select using (public.current_user_is_admin());
drop policy if exists "Admins add profile notes" on public.admin_profile_notes;
create policy "Admins add profile notes" on public.admin_profile_notes for insert
  with check (public.current_user_is_admin() and admin_id = auth.uid());
drop policy if exists "Admins manage profile notes" on public.admin_profile_notes;
create policy "Admins manage profile notes" on public.admin_profile_notes for delete using (public.current_user_is_admin());
drop policy if exists "Admins read profile history" on public.admin_profile_history;
create policy "Admins read profile history" on public.admin_profile_history for select using (public.current_user_is_admin());

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "Users mark own notifications read" on public.notifications;
create policy "Users mark own notifications read" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Subscribe to job alerts" on public.job_alert_subscriptions;
create policy "Subscribe to job alerts" on public.job_alert_subscriptions for insert
  with check (
    active = true and consented_at is not null and email_enabled = true and
    (user_id is null or (user_id = auth.uid() and email = lower(coalesce((select p.email from public.profiles p where p.id=auth.uid()),''))))
  );
drop policy if exists "Users read own job alerts" on public.job_alert_subscriptions;
create policy "Users read own job alerts" on public.job_alert_subscriptions for select
  using (user_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "Users update own job alerts" on public.job_alert_subscriptions;
create policy "Users update own job alerts" on public.job_alert_subscriptions for update
  using (user_id = auth.uid() or public.current_user_is_admin())
  with check (user_id = auth.uid() or public.current_user_is_admin());
drop policy if exists "Users delete own job alerts" on public.job_alert_subscriptions;
create policy "Users delete own job alerts" on public.job_alert_subscriptions for delete
  using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Admins read job alert deliveries" on public.job_alert_deliveries;
create policy "Admins read job alert deliveries" on public.job_alert_deliveries for select using (public.current_user_is_admin());
drop policy if exists "Active taluks are public" on public.taluks;
create policy "Active taluks are public" on public.taluks for select using (active=true);
drop policy if exists "Admins manage taluks" on public.taluks;
create policy "Admins manage taluks" on public.taluks for all
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

revoke update on public.profiles from authenticated;
grant update(full_name,phone,headline,bio,skills,resume_path,company_name,company_website,company_description,location,
  account_status,interest_status,admin_status_updated_at,admin_status_updated_by) on public.profiles to authenticated;
revoke update on public.notifications from authenticated;
grant update(read_at) on public.notifications to authenticated;
revoke update on public.applications from authenticated;
grant update(status) on public.applications to authenticated;

create or replace function public.protect_profile_admin_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    if new.account_status is distinct from old.account_status or new.interest_status is distinct from old.interest_status
      or new.admin_status_updated_by is distinct from old.admin_status_updated_by
      or new.admin_status_updated_at is distinct from old.admin_status_updated_at then
      raise exception 'Only an administrator can change profile status';
    end if;
    if new.role is distinct from old.role or new.is_admin is distinct from old.is_admin or new.email is distinct from old.email then
      raise exception 'Profile role and email are managed by account administrators';
    end if;
  elsif old.account_status is distinct from new.account_status or old.interest_status is distinct from new.interest_status then
    new.admin_status_updated_at := now();
    new.admin_status_updated_by := coalesce(auth.uid(),new.admin_status_updated_by,
      (select p.id from public.profiles p where p.is_admin=true order by p.created_at limit 1));
  end if;
  return new;
end $$;
drop trigger if exists protect_profile_admin_fields on public.profiles;
create trigger protect_profile_admin_fields before update on public.profiles
  for each row execute procedure public.protect_profile_admin_fields();

create or replace function public.record_admin_profile_status() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid;
begin
  actor_id := coalesce(auth.uid(),new.admin_status_updated_by,
    (select p.id from public.profiles p where p.is_admin=true order by p.created_at limit 1));
  if old.account_status is distinct from new.account_status then
    insert into public.admin_profile_history(profile_id,admin_id,field_name,old_value,new_value)
      values(new.id,actor_id,'account_status',old.account_status,new.account_status);
    insert into public.notifications(user_id,kind,title,body,href)
      values(new.id,'profile_status','Account status updated','An administrator updated your account status.','/dashboard');
  end if;
  if old.interest_status is distinct from new.interest_status then
    insert into public.admin_profile_history(profile_id,admin_id,field_name,old_value,new_value)
      values(new.id,actor_id,'interest_status',old.interest_status,new.interest_status);
    insert into public.notifications(user_id,kind,title,body,href)
      values(new.id,'profile_status','Profile status updated','Your profile is now marked '||replace(new.interest_status,'_',' ')||'.','/dashboard');
  end if;
  return new;
end $$;
drop trigger if exists log_admin_profile_status on public.profiles;
create trigger log_admin_profile_status after update of account_status,interest_status on public.profiles
  for each row when (old.account_status is distinct from new.account_status or old.interest_status is distinct from new.interest_status)
  execute procedure public.record_admin_profile_status();

create or replace function public.notify_application_status() returns trigger
language plpgsql security definer set search_path = '' as $$
declare job_title text;
begin
  if old.status is distinct from new.status then
    select j.title into job_title from public.jobs j where j.id=new.job_id;
    insert into public.notifications(user_id,kind,title,body,href,job_id)
      values(new.candidate_id,'application_status','Application status updated',
        'Your application for '||coalesce(job_title,'a job')||' is now '||replace(new.status,'_',' ')||'.',
        '/dashboard',new.job_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_candidate_application_status on public.applications;
create trigger notify_candidate_application_status after update of status on public.applications
  for each row execute procedure public.notify_application_status();

create or replace function public.enqueue_job_alerts() returns trigger
language plpgsql security definer set search_path = '' as $$
declare sub record;
begin
  if new.status <> 'published' then return new; end if;
  if tg_op='UPDATE' and old.status='published' then return new; end if;
  if new.expires_at is not null and new.expires_at <= now() then return new; end if;
  for sub in
    select s.* from public.job_alert_subscriptions s
    where s.active=true
      and (s.taluk is null or s.taluk=new.taluk)
      and (s.area_id is null or s.area_id=new.area_id)
      and (s.category is null or lower(s.category)=lower(new.category))
  loop
    if sub.user_id is not null and sub.in_app_enabled then
      insert into public.notifications(user_id,kind,title,body,href,job_id)
        values(sub.user_id,'new_job','New job in Kolar',new.title||' · '||new.location,
          '/jobs?id='||new.id::text,new.id);
    end if;
    if sub.email_enabled then
      insert into public.job_alert_deliveries(subscription_id,job_id)
        values(sub.id,new.id) on conflict(subscription_id,job_id) do nothing;
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists enqueue_alerts_for_published_job_insert on public.jobs;
create trigger enqueue_alerts_for_published_job_insert after insert on public.jobs
  for each row execute procedure public.enqueue_job_alerts();
drop trigger if exists enqueue_alerts_for_published_job_update on public.jobs;
create trigger enqueue_alerts_for_published_job_update after update of status on public.jobs
  for each row execute procedure public.enqueue_job_alerts();

create or replace function public.create_alert_for_newsletter_subscriber() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.active then
    insert into public.job_alert_subscriptions(email,email_enabled,active,consented_at)
      values(lower(trim(new.email)),true,true,now()) on conflict(subscription_key)
      do update set active=true,email_enabled=true,consented_at=now();
  else
    update public.job_alert_subscriptions set active=false,updated_at=now()
      where email=lower(trim(new.email));
  end if;
  return new;
end $$;
drop trigger if exists newsletter_to_job_alert on public.newsletter_subscribers;
create trigger newsletter_to_job_alert after insert on public.newsletter_subscribers
  for each row execute procedure public.create_alert_for_newsletter_subscriber();
drop trigger if exists newsletter_update_job_alert on public.newsletter_subscribers;
create trigger newsletter_update_job_alert after update of active on public.newsletter_subscribers
  for each row execute procedure public.create_alert_for_newsletter_subscriber();
insert into public.job_alert_subscriptions(email,email_enabled,active,consented_at)
  select lower(trim(email)),true,true,created_at from public.newsletter_subscribers where active=true
  on conflict(subscription_key) do nothing;

-- Public opt-in RPC. An authenticated account is linked only when the submitted
-- email matches the email already verified by Supabase Auth.
create or replace function public.subscribe_to_job_alerts(
  p_email text,
  p_taluk text default null,
  p_area_id uuid default null,
  p_category text default null
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  normalized_email text := lower(trim(coalesce(p_email,'')));
  matched_user_id uuid := null;
  selected_area_taluk text;
begin
  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(normalized_email)>254 then
    raise exception 'Enter a valid email address';
  end if;
  if p_taluk is not null and not exists(select 1 from public.taluks t where t.name=p_taluk and t.active) then
    raise exception 'Choose a current Kolar taluk';
  end if;
  if p_area_id is not null then
    select a.taluk into selected_area_taluk from public.areas a where a.id=p_area_id and a.active;
    if selected_area_taluk is null or (p_taluk is not null and selected_area_taluk<>p_taluk) then
      raise exception 'Choose an area within the selected taluk';
    end if;
  end if;
  if p_category is not null and not exists(select 1 from public.job_categories c where c.name=p_category and c.active) then
    raise exception 'Choose a current job category';
  end if;
  if auth.uid() is not null and exists(
    select 1 from public.profiles p where p.id=auth.uid() and lower(coalesce(p.email,''))=normalized_email
  ) then
    matched_user_id := auth.uid();
  end if;
  insert into public.job_alert_subscriptions(user_id,email,taluk,area_id,category,email_enabled,in_app_enabled,active,consented_at)
  values(matched_user_id,normalized_email,p_taluk,p_area_id,p_category,true,matched_user_id is not null,true,now())
  on conflict(subscription_key) do update set
    user_id=coalesce(public.job_alert_subscriptions.user_id,excluded.user_id),
    email_enabled=true,
    in_app_enabled=public.job_alert_subscriptions.in_app_enabled or excluded.in_app_enabled,
    active=true,
    consented_at=now(),
    updated_at=now();
  return true;
end $$;
revoke all on function public.subscribe_to_job_alerts(text,text,uuid,text) from public;
grant execute on function public.subscribe_to_job_alerts(text,text,uuid,text) to anon,authenticated;

create or replace function public.unsubscribe_job_alert(p_token uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.job_alert_subscriptions set active=false,updated_at=now() where unsubscribe_token=p_token and active=true;
  get diagnostics changed = row_count;
  return changed > 0;
end $$;
grant execute on function public.unsubscribe_job_alert(uuid) to anon,authenticated;

-- Enable scoped Postgres Changes. Realtime still applies each subscriber's RLS policies.
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='jobs') then
    alter publication supabase_realtime add table public.jobs;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='applications') then
    alter publication supabase_realtime add table public.applications;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='job_alert_deliveries') then
    alter publication supabase_realtime add table public.job_alert_deliveries;
  end if;
end $$;
