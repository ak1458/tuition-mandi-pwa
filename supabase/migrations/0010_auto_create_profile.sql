-- Auto-create a profiles row when a new user signs up via auth.users.
-- Without this, Phone OTP signup creates an auth.users entry but no profiles row,
-- which breaks all RLS queries (they reference profiles.plan, profiles.plan_expires_at).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone_e164, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Teacher'),
    new.phone,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
