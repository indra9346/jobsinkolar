-- Production hardening (from the Supabase security advisor):
-- 1. Only expose RPCs the app actually calls; trigger/internal functions are not callable via the API.
-- 2. company_directory no longer bypasses RLS.
-- 3. Fixed search_path on remaining functions.
-- 4. Abuse limits on anonymous inserts (contact form, area suggestions, alerts).

------------------------------------------------------------------------------
-- 1. Function privileges
------------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- Helpers referenced by RLS policies must stay executable for every API role.
grant execute on function public.current_user_is_admin() to anon, authenticated;
grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.current_user_active() to anon, authenticated;
grant execute on function public.employer_can_read_file(text) to anon, authenticated;
grant execute on function public.can_message(uuid) to authenticated;
grant execute on function public.employer_can_see_contact(uuid) to authenticated;

-- Public RPCs
grant execute on function public.public_stats() to anon, authenticated;
grant execute on function public.search_suggest(text, text, integer) to anon, authenticated;
grant execute on function public.increment_job_view(uuid) to anon, authenticated;
grant execute on function public.subscribe_to_job_alerts(text, text, uuid, text) to anon, authenticated;
grant execute on function public.unsubscribe_job_alert(uuid) to anon, authenticated;

-- Signed-in RPCs (each checks the caller's role internally)
grant execute on function public.candidate_card(uuid) to authenticated;
grant execute on function public.search_talent_v2(text, text, integer, integer, text, text, text, boolean, integer, integer, integer) to authenticated;
grant execute on function public.unlock_candidate(uuid) to authenticated;
grant execute on function public.mark_unlocks_downloaded(uuid[]) to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_grant_credits(uuid, integer, integer, text, integer) to authenticated;

-- Superseded by search_talent_v2.
drop function if exists public.search_talent(text, text, integer, integer, text, text, boolean, integer, integer);

------------------------------------------------------------------------------
-- 2. Company directory without SECURITY DEFINER
------------------------------------------------------------------------------
alter table public.companies add column if not exists listed boolean not null default true;
update public.companies c set listed = (p.account_status = 'active') from public.profiles p where p.id = c.id;

create or replace function public.sync_company_listed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.companies set listed = (new.account_status = 'active') where id = new.id;
  return new;
end $$;
revoke execute on function public.sync_company_listed() from public, anon, authenticated;
drop trigger if exists sync_company_listed on public.profiles;
create trigger sync_company_listed after update of account_status on public.profiles
  for each row when (old.account_status is distinct from new.account_status)
  execute procedure public.sync_company_listed();

drop view if exists public.company_directory;
create view public.company_directory with (security_invoker = true) as
  select c.id, c.name, c.slug, c.logo_path, c.industry, c.company_size, c.website, c.about, c.taluk, c.verified, c.created_at,
    (select count(*) from public.jobs j where j.company_id = c.id and j.status = 'published' and (j.expires_at is null or j.expires_at > now()))::int as open_jobs
  from public.companies c
  where c.listed;
grant select on public.company_directory to anon, authenticated;

------------------------------------------------------------------------------
-- 3. search_path
------------------------------------------------------------------------------
alter function public.set_updated_at() set search_path = '';
alter function public.wallet_usable(public.employer_wallets) set search_path = '';

------------------------------------------------------------------------------
-- 4. Abuse limits for anonymous inserts
------------------------------------------------------------------------------
create or replace function public.limit_contact_messages() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.contact_messages where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many messages from this email. Please try again in an hour.';
  end if;
  if (select count(*) from public.contact_messages where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'We are receiving a lot of messages right now. Please try again shortly.';
  end if;
  new.status := 'open';
  return new;
end $$;
revoke execute on function public.limit_contact_messages() from public, anon, authenticated;
drop trigger if exists limit_contact_messages on public.contact_messages;
create trigger limit_contact_messages before insert on public.contact_messages for each row execute procedure public.limit_contact_messages();

create or replace function public.limit_area_suggestions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.area_suggestions where lower(area_name) = lower(trim(new.area_name)) and taluk = new.taluk and status = 'pending') then
    raise exception 'This locality has already been suggested and is being reviewed.';
  end if;
  if (select count(*) from public.area_suggestions where created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Too many suggestions right now. Please try again later.';
  end if;
  new.area_name := trim(new.area_name);
  return new;
end $$;
revoke execute on function public.limit_area_suggestions() from public, anon, authenticated;
drop trigger if exists limit_area_suggestions on public.area_suggestions;
create trigger limit_area_suggestions before insert on public.area_suggestions for each row execute procedure public.limit_area_suggestions();

alter table public.area_suggestions drop constraint if exists area_suggestions_name_len;
alter table public.area_suggestions add constraint area_suggestions_name_len check (length(trim(area_name)) between 2 and 80);
