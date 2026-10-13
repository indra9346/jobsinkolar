-- Enforce profile lock status across writes and require verified job locations.

create or replace function public.validate_job_kolar_area() returns trigger
language plpgsql set search_path = '' as $$
declare selected_taluk text;
begin
  if tg_op = 'INSERT' and new.area_id is null then
    raise exception 'Choose a verified Kolar district area for this job';
  end if;
  if new.area_id is not null then
    select a.taluk into selected_taluk from public.areas a
      where a.id=new.area_id and a.active=true and a.verified=true;
    if selected_taluk is null or selected_taluk is distinct from new.taluk then
      raise exception 'The selected area does not match an active verified locality in that Kolar taluk';
    end if;
    new.location := (select a.name from public.areas a where a.id=new.area_id);
  elsif tg_op='UPDATE' and (new.area_id is distinct from old.area_id or new.taluk is distinct from old.taluk) then
    raise exception 'Choose a verified Kolar district area for this job';
  end if;
  return new;
end $$;

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

drop policy if exists "Employers create jobs" on public.jobs;
create policy "Employers create jobs" on public.jobs for insert
  with check (
    employer_id=auth.uid() and status in ('draft','pending_review') and exists(
      select 1 from public.profiles p where p.id=auth.uid() and p.role='employer' and p.account_status='active'
    )
  );
drop policy if exists "Employers update own jobs" on public.jobs;
create policy "Employers update own jobs" on public.jobs for update
  using (public.current_user_is_admin() or (employer_id=auth.uid() and exists(
    select 1 from public.profiles p where p.id=auth.uid() and p.role='employer' and p.account_status='active'
  )))
  with check (public.current_user_is_admin() or (employer_id=auth.uid() and exists(
    select 1 from public.profiles p where p.id=auth.uid() and p.role='employer' and p.account_status='active'
  )));
drop policy if exists "Employers delete own jobs" on public.jobs;
create policy "Employers delete own jobs" on public.jobs for delete
  using (public.current_user_is_admin() or (employer_id=auth.uid() and exists(
    select 1 from public.profiles p where p.id=auth.uid() and p.role='employer' and p.account_status='active'
  )));

drop policy if exists "Candidates apply to published jobs" on public.applications;
create policy "Candidates apply to published jobs" on public.applications for insert
  with check (
    candidate_id=auth.uid() and exists(
      select 1 from public.profiles p where p.id=auth.uid() and p.role='candidate' and p.account_status='active' and p.is_admin=false
    ) and exists(select 1 from public.jobs j where j.id=job_id and j.status='published')
  );

drop policy if exists "Candidates manage saved jobs" on public.saved_jobs;
create policy "Candidates manage saved jobs" on public.saved_jobs for all
  using (candidate_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='candidate' and p.account_status='active'))
  with check (candidate_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='candidate' and p.account_status='active'));

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='job_alert_deliveries') then
    alter publication supabase_realtime add table public.job_alert_deliveries;
  end if;
end $$;
