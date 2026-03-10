create or replace view public.dashboard_monthly_summary
with (security_invoker = true)
as
with student_counts as (
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
  p.id as teacher_id,
  date_trunc('month', current_date)::date as month_start,
  coalesce(sc.total_students, 0) as total_students,
  coalesce(at.present_today, 0) as present_today,
  coalesce(fc.fees_collected, 0)::numeric(10, 2) as fees_collected,
  coalesce(fc.fee_pending_count, 0) as fee_pending_count
from public.profiles p
left join student_counts sc on sc.teacher_id = p.id
left join attendance_today at on at.teacher_id = p.id
left join fees_current_month fc on fc.teacher_id = p.id;
