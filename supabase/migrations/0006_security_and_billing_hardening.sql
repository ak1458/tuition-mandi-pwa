create table if not exists public.plan_payment_receipts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'razorpay',
  payment_id text not null unique,
  cycle text not null check (cycle in ('monthly', 'yearly')),
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_plan_payment_receipts_teacher_id
  on public.plan_payment_receipts (teacher_id);

alter table public.plan_payment_receipts enable row level security;

drop policy if exists plan_payment_receipts_select_own on public.plan_payment_receipts;
create policy plan_payment_receipts_select_own on public.plan_payment_receipts
for select using (teacher_id = auth.uid());

create or replace function public.prevent_client_plan_tampering()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated'
    and (
      new.plan is distinct from old.plan
      or new.plan_expires_at is distinct from old.plan_expires_at
    ) then
    raise exception 'PLAN_FIELDS_READ_ONLY';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_client_plan_tampering on public.profiles;
create trigger trg_prevent_client_plan_tampering
before update on public.profiles
for each row execute function public.prevent_client_plan_tampering();

create or replace view public.dashboard_monthly_summary
with (security_invoker = true)
as
with teacher_ids as (
  select p.id as teacher_id
  from public.profiles p
  union
  select s.teacher_id
  from public.students s
  union
  select b.teacher_id
  from public.batches b
  union
  select f.teacher_id
  from public.fee_records f
  union
  select a.teacher_id
  from public.attendance_sessions a
),
student_counts as (
  select
    teacher_id,
    count(*) filter (where is_active) as total_students
  from public.students
  group by teacher_id
),
attendance_today as (
  select
    asn.teacher_id,
    count(*) filter (where ar.status = 'present') as present_today
  from public.attendance_records ar
  join public.attendance_sessions asn on asn.id = ar.session_id
  where asn.session_date = current_date
  group by asn.teacher_id
),
fees_current_month as (
  select
    teacher_id,
    coalesce(sum(amount_paid), 0)::numeric(10, 2) as fees_collected,
    count(*) filter (where status <> 'paid') as fee_pending_count
  from public.fee_records
  where fee_month = date_trunc('month', current_date)::date
  group by teacher_id
)
select
  t.teacher_id,
  date_trunc('month', current_date)::date as month_start,
  coalesce(sc.total_students, 0) as total_students,
  coalesce(at.present_today, 0) as present_today,
  coalesce(fc.fees_collected, 0)::numeric(10, 2) as fees_collected,
  coalesce(fc.fee_pending_count, 0) as fee_pending_count
from teacher_ids t
left join student_counts sc on sc.teacher_id = t.teacher_id
left join attendance_today at on at.teacher_id = t.teacher_id
left join fees_current_month fc on fc.teacher_id = t.teacher_id;
