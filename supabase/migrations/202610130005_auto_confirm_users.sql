-- Auto-confirm all users immediately upon registration without email verification requirement
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

create or replace function public.auto_confirm_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_before_created on auth.users;
create trigger on_auth_user_before_created
  before insert on auth.users
  for each row
  execute function public.auto_confirm_user();
