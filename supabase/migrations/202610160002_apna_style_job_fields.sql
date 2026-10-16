-- apnaHire-style job posting fields: pay structure, interview details, fee disclosure.
alter table public.jobs drop constraint if exists jobs_work_mode_check;
alter table public.jobs add constraint jobs_work_mode_check check (work_mode in ('on_site','hybrid','remote','field'));
alter table public.jobs add column if not exists pay_type text not null default 'fixed' check (pay_type in ('fixed','fixed_incentive','incentive'));
alter table public.jobs add column if not exists incentive_max integer check (incentive_max is null or incentive_max >= 0);
alter table public.jobs add column if not exists english_level text not null default 'none' check (english_level in ('none','basic','good','fluent'));
alter table public.jobs add column if not exists interview_address text;
alter table public.jobs add column if not exists interview_timings text;
alter table public.jobs add column if not exists contact_name text;
alter table public.jobs add column if not exists joining_fee boolean not null default false;
alter table public.jobs add column if not exists joining_fee_amount integer check (joining_fee_amount is null or joining_fee_amount >= 0);
alter table public.jobs add column if not exists joining_fee_reason text;

-- A job that charges candidates must explain why; moderators see this before approving.
do $$ begin
  alter table public.jobs add constraint jobs_fee_disclosed check (not joining_fee or (joining_fee_amount is not null and coalesce(trim(joining_fee_reason),'') <> ''));
exception when duplicate_object then null; end $$;

-- Candidates can attach an English level too (used in database filters).
alter table public.profiles add column if not exists english_level text check (english_level is null or english_level in ('none','basic','good','fluent'));
alter table public.profiles add column if not exists gender text check (gender is null or gender in ('female','male','other'));

revoke update on public.profiles from authenticated;
grant update(full_name,phone,headline,bio,skills,resume_path,company_name,company_website,company_description,location,
  current_title,experience_years,education,expected_salary,availability,languages,taluk,open_to_work,talent_visible,
  preferred_categories,last_active_at,english_level,gender,account_status,interest_status,admin_status_updated_at,admin_status_updated_by,role,is_admin)
  on public.profiles to authenticated;

-- Talent search: add English level filter.
create or replace function public.search_talent_v2(
  p_query text default null, p_taluk text default null, p_min_exp integer default null, p_max_exp integer default null,
  p_availability text default null, p_category text default null, p_english text default null, p_unlocked_only boolean default false,
  p_active_days integer default null, p_limit integer default 20, p_offset integer default 0
) returns table(
  id uuid, display_name text, current_title text, experience_years integer, education text, taluk text, location text,
  skills text[], languages text[], expected_salary integer, availability text, preferred_categories text[], english_level text,
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
      and (p_english is null or p.english_level = p_english or (p_english = 'basic' and p.english_level in ('good','fluent')) or (p_english = 'good' and p.english_level = 'fluent'))
      and (p_active_days is null or p.last_active_at > now() - make_interval(days => p_active_days))
      and (p_query is null or trim(p_query) = '' or
           (coalesce(p.current_title,'') || ' ' || coalesce(p.headline,'') || ' ' || array_to_string(p.skills,' ') || ' ' || coalesce(p.education,''))
             ilike '%' || trim(p_query) || '%')
  )
  select b.id,
    case when b.is_unlocked then b.full_name
      else split_part(trim(b.full_name),' ',1) || coalesce(' ' || nullif(left(split_part(trim(b.full_name),' ',2),1),'') || '.','') end,
    coalesce(b.current_title, b.headline), b.experience_years, b.education, b.taluk, b.location,
    b.skills, b.languages, b.expected_salary, b.availability, b.preferred_categories, b.english_level,
    b.resume_path is not null,
    (select count(*)::int from public.candidate_documents d where d.candidate_id = b.id and d.status = 'verified'),
    b.last_active_at, b.is_unlocked, count(*) over()
  from base b
  where (not p_unlocked_only or b.is_unlocked)
  order by b.open_to_work desc, b.last_active_at desc
  limit least(greatest(p_limit,1),50) offset greatest(p_offset,0);
end $$;
grant execute on function public.search_talent_v2(text,text,integer,integer,text,text,text,boolean,integer,integer,integer) to authenticated;

-- Employers may export unlocked candidates; mark which ones were downloaded.
alter table public.candidate_unlocks add column if not exists downloaded_at timestamptz;
create or replace function public.mark_unlocks_downloaded(p_ids uuid[]) returns void
language sql security definer set search_path = '' as $$
  update public.candidate_unlocks set downloaded_at = now() where employer_id = auth.uid() and candidate_id = any(p_ids)
$$;
grant execute on function public.mark_unlocks_downloaded(uuid[]) to authenticated;
