alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists plan_expires_at timestamptz default null;

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro'));

create or replace function public.is_teacher_pro(teacher_uuid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_plan text;
  profile_expiry timestamptz;
begin
  select p.plan, p.plan_expires_at
    into profile_plan, profile_expiry
  from public.profiles p
  where p.id = teacher_uuid;

  if profile_plan <> 'pro' then
    return false;
  end if;

  if profile_expiry is null then
    return true;
  end if;

  return profile_expiry >= now();
end;
$$;

create or replace function public.enforce_student_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_student_count integer;
begin
  if coalesce(new.is_active, true) = false then
    return new;
  end if;

  if public.is_teacher_pro(new.teacher_id) then
    return new;
  end if;

  select count(*)
    into active_student_count
  from public.students s
  where s.teacher_id = new.teacher_id
    and s.is_active = true;

  if active_student_count >= 15 then
    raise exception 'UPGRADE_REQUIRED_STUDENT_LIMIT';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_student_limit on public.students;
create trigger trg_enforce_student_limit
before insert on public.students
for each row execute function public.enforce_student_limit();

create or replace function public.enforce_ai_report_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ai_report_count integer;
begin
  if new.generated_by in ('manual_template', 'seed_demo') then
    return new;
  end if;

  if public.is_teacher_pro(new.teacher_id) then
    return new;
  end if;

  select count(*)
    into ai_report_count
  from public.progress_reports pr
  where pr.teacher_id = new.teacher_id
    and pr.generated_by <> 'manual_template'
    and pr.generated_by <> 'seed_demo';

  if ai_report_count >= 1 then
    raise exception 'UPGRADE_REQUIRED';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_ai_report_limit on public.progress_reports;
create trigger trg_enforce_ai_report_limit
before insert on public.progress_reports
for each row execute function public.enforce_ai_report_limit();
