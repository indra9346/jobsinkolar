-- Auto-suggest for every search box. Suggestions come from live data (job titles,
-- companies, categories, skills, candidate roles) plus a curated dictionary of
-- roles and skills common in Kolar district, so results stay useful early on.

create table if not exists public.suggestion_terms (
  term text not null,
  kind text not null check (kind in ('role','skill')),
  weight integer not null default 1,
  primary key (term, kind)
);
alter table public.suggestion_terms enable row level security;
drop policy if exists "terms public" on public.suggestion_terms;
create policy "terms public" on public.suggestion_terms for select using (true);
drop policy if exists "terms admin" on public.suggestion_terms;
create policy "terms admin" on public.suggestion_terms for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

insert into public.suggestion_terms(term, kind, weight) values
  -- Manufacturing, automotive, electronics (Narasapura, Vemagal, Malur, KGF/BEML belt)
  ('Machine Operator','role',9),('CNC Operator','role',9),('VMC Operator','role',7),('CNC Programmer','role',6),('Production Supervisor','role',8),
  ('Quality Inspector','role',8),('Quality Engineer','role',7),('Assembly Line Worker','role',8),('Fitter','role',7),('Welder','role',7),
  ('Electrician','role',8),('Maintenance Technician','role',7),('Mechanical Engineer','role',6),('Production Engineer','role',6),('Tool Room Operator','role',5),
  ('Forklift Operator','role',6),('Helper','role',7),('Packing Staff','role',7),('Store Keeper','role',6),('Safety Officer','role',5),
  ('ITI Trainee','role',7),('Diploma Trainee','role',7),('Apprentice','role',6),('Plant Manager','role',4),('Painter','role',4),
  -- Logistics & warehousing
  ('Warehouse Associate','role',7),('Warehouse Supervisor','role',6),('Picker Packer','role',6),('Delivery Executive','role',8),('Driver','role',8),
  ('Logistics Coordinator','role',5),('Inventory Executive','role',5),
  -- Healthcare
  ('Staff Nurse','role',9),('ICU Nurse','role',6),('Lab Technician','role',7),('Pharmacist','role',7),('Medical Representative','role',6),
  ('Ward Boy','role',5),('Hospital Receptionist','role',5),('Physiotherapist','role',4),('X-Ray Technician','role',4),('Doctor','role',5),
  -- Education
  ('Teacher','role',8),('Primary Teacher','role',6),('Kannada Teacher','role',5),('English Teacher','role',6),('Maths Teacher','role',6),
  ('Lecturer','role',5),('Tutor','role',5),('School Administrator','role',4),
  -- Office, finance, IT
  ('Accountant','role',9),('Accounts Assistant','role',6),('Data Entry Operator','role',9),('Office Assistant','role',7),('Receptionist','role',7),
  ('HR Executive','role',6),('Admin Executive','role',5),('Computer Operator','role',7),('Software Developer','role',5),('IT Support','role',5),
  ('Bank Clerk','role',4),('Insurance Advisor','role',4),('Back Office Executive','role',6),('Telecaller','role',7),('Customer Support Executive','role',7),
  -- Sales & retail
  ('Sales Executive','role',9),('Field Sales Executive','role',7),('Showroom Sales','role',6),('Store Manager','role',5),('Cashier','role',7),
  ('Retail Associate','role',6),('Marketing Executive','role',6),('Business Development Executive','role',5),
  -- Hospitality, services, agriculture, security
  ('Cook','role',6),('Kitchen Helper','role',5),('Waiter','role',5),('Hotel Front Office','role',4),('Housekeeping','role',6),
  ('Security Guard','role',8),('Security Supervisor','role',5),('Beautician','role',4),('Tailor','role',5),('Plumber','role',5),
  ('Farm Supervisor','role',4),('Agriculture Field Officer','role',4),('Dairy Technician','role',4),('Mining Technician','role',3),
  -- Skills
  ('MS Excel','skill',9),('MS Office','skill',8),('Tally','skill',9),('GST filing','skill',6),('Typing','skill',7),('Kannada typing','skill',5),
  ('Customer service','skill',8),('Communication','skill',7),('Sales','skill',7),('Negotiation','skill',4),
  ('CNC operation','skill',8),('VMC operation','skill',6),('Fanuc','skill',5),('Siemens PLC','skill',4),('Blueprint reading','skill',5),
  ('Vernier caliper','skill',5),('Micrometer','skill',4),('Quality inspection','skill',7),('5S','skill',5),('Kaizen','skill',4),
  ('MIG welding','skill',5),('TIG welding','skill',5),('Arc welding','skill',5),('Electrical wiring','skill',6),('Panel wiring','skill',4),
  ('Forklift','skill',5),('Inventory management','skill',5),('SAP','skill',5),('Two-wheeler licence','skill',6),('LMV driving licence','skill',6),
  ('HMV driving licence','skill',4),('Patient care','skill',6),('IV cannulation','skill',4),('Phlebotomy','skill',4),('First aid','skill',5),
  ('Teaching','skill',6),('Lesson planning','skill',4),('Spoken English','skill',6),('Computer basics','skill',8),('Python','skill',3),
  ('Java','skill',3),('Web development','skill',3),('Graphic design','skill',3),('Cooking','skill',4),('Tailoring','skill',4)
on conflict (term, kind) do update set weight = excluded.weight;

-- One function serves every box. p_kind:
--   job       → titles, companies, categories, skills from live jobs + roles
--   title     → job titles + candidate roles + curated roles (wizard, profile)
--   skill     → skills from jobs and profiles + curated skills
--   company   → company names (public directory)
--   talent    → candidate roles/skills (employers/admins; aggregated, no names)
--   candidate → candidate names/emails (admins only)
create or replace function public.search_suggest(p_q text default '', p_kind text default 'job', p_limit integer default 8)
returns table(value text, type text, hits integer)
language plpgsql stable security definer set search_path = '' as $$
declare q text := lower(trim(coalesce(p_q,''))); lim integer := least(greatest(coalesce(p_limit,8),1),20);
begin
  if length(q) > 60 then q := left(q, 60); end if;

  if p_kind = 'candidate' then
    if not public.current_user_is_admin() then return; end if;
    return query
      select p.full_name, 'candidate'::text, 1 from public.profiles p
      where p.role = 'candidate' and not p.is_admin and p.full_name <> '' and (q = '' or lower(p.full_name) like '%'||q||'%' or lower(coalesce(p.email,'')) like q||'%')
      order by (lower(p.full_name) like q||'%') desc, p.full_name limit lim;
    return;
  end if;

  if p_kind = 'talent' and coalesce(public.current_user_role(),'') not in ('employer','admin') then return; end if;

  return query
  with live as (
    select j.* from public.jobs j where j.status = 'published' and (j.expires_at is null or j.expires_at > now())
  ),
  pool as (
    select j.title as v, 'title'::text as t, count(*)::int as h, 3 as w from live j where p_kind in ('job','title') group by j.title
    union all select j.company_name, 'company', count(*)::int, 2 from live j where p_kind in ('job','company') group by j.company_name
    union all select c.name, 'company', 0, 1 from public.companies c join public.profiles p on p.id = c.id and p.account_status='active'
      where p_kind = 'company' and c.name <> 'My company'
    union all select j.category, 'category', count(*)::int, 2 from live j where p_kind = 'job' group by j.category
    union all select s, 'skill', count(*)::int, 1 from live j, unnest(j.skills) s where p_kind in ('job','skill') group by s
    union all select p.current_title, 'role', count(*)::int, 1 from public.profiles p
      where p_kind in ('title','talent') and p.role='candidate' and p.current_title is not null and (p_kind='title' or p.talent_visible) group by p.current_title
    union all select s, 'skill', count(*)::int, 1 from public.profiles p, unnest(p.skills) s
      where p_kind in ('skill','talent') and p.role='candidate' and (p_kind='skill' or p.talent_visible) group by s
    union all select st.term, case when st.kind='role' then 'title' else 'skill' end, 0, st.weight from public.suggestion_terms st
      where (st.kind='role' and p_kind in ('job','title','talent')) or (st.kind='skill' and p_kind in ('skill','talent','job'))
  ),
  matched as (
    select v, t, h, w from pool
    where v is not null and length(trim(v)) > 1
      and (q = '' or lower(v) like '%'||q||'%')
  ),
  dedup as (
    select distinct on (lower(v)) v, t, h, w from matched
    order by lower(v), h desc, w desc
  )
  select d.v, d.t, d.h from dedup d
  order by (q <> '' and lower(d.v) like q||'%') desc, d.h desc, d.w desc, length(d.v), d.v
  limit lim;
end $$;
grant execute on function public.search_suggest(text, text, integer) to anon, authenticated;

-- Location filter by verified locality.
create index if not exists jobs_area_idx on public.jobs(area_id) where status = 'published';
