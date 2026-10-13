-- Require verified Kolar locality data for every job that becomes public.
create or replace function public.validate_job_kolar_area() returns trigger
language plpgsql set search_path = '' as $$
declare selected_taluk text;
begin
  if (tg_op='INSERT' or (tg_op='UPDATE' and new.status='published')) and new.area_id is null then
    raise exception 'Choose a verified Kolar district area before publishing this job';
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

drop trigger if exists jobs_require_kolar_area_update on public.jobs;
create trigger jobs_require_kolar_area_update before update of area_id,taluk,status on public.jobs
  for each row execute procedure public.validate_job_kolar_area();
