-- In-app job alerts link to the job detail route (/jobs/:id).
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
        values(sub.user_id,'new_job','New job in Kolar',new.title||' · '||new.location,'/jobs/'||new.id::text,new.id);
    end if;
    if sub.email_enabled then
      insert into public.job_alert_deliveries(subscription_id,job_id)
        values(sub.id,new.id) on conflict(subscription_id,job_id) do nothing;
    end if;
  end loop;
  return new;
end $$;
update public.notifications set href = '/jobs/' || job_id::text where kind = 'new_job' and job_id is not null and href like '/jobs?id=%';
