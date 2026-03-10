create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.attendance_status as enum ('present', 'absent');
create type public.fee_status as enum ('pending', 'partial', 'paid');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone_e164 text unique,
  email text,
  locale text not null default 'hi-IN',
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  class_label text not null,
  subject text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  class_label text not null,
  subject text not null,
  monthly_fee numeric(10, 2) not null check (monthly_fee >= 0),
  guardian_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.batch_students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  batch_id uuid not null references public.batches (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, student_id)
);

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  batch_id uuid not null references public.batches (id) on delete cascade,
  session_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, session_date)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.attendance_sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  status public.attendance_status not null,
  marked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create table if not exists public.fee_records (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  fee_month date not null check (date_trunc('month', fee_month) = fee_month::timestamp),
  amount_due numeric(10, 2) not null check (amount_due >= 0),
  amount_paid numeric(10, 2) not null default 0 check (amount_paid >= 0),
  status public.fee_status not null default 'pending',
  paid_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, fee_month)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  assessment_date date not null,
  title text not null,
  score numeric(5, 2) not null check (score >= 0),
  max_score numeric(5, 2) not null default 100 check (max_score > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_reports (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  report_month date not null check (date_trunc('month', report_month) = report_month::timestamp),
  attendance_percent numeric(5, 2) not null default 0,
  avg_score numeric(5, 2) not null default 0,
  tests_done integer not null default 0 check (tests_done >= 0),
  language text not null default 'hi',
  report_text text not null,
  generated_by text not null default 'gemini_flash',
  shared_via_whatsapp boolean not null default false,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_batches_updated_at on public.batches;
create trigger set_batches_updated_at before update on public.batches
for each row execute function public.set_updated_at();

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists set_batch_students_updated_at on public.batch_students;
create trigger set_batch_students_updated_at before update on public.batch_students
for each row execute function public.set_updated_at();

drop trigger if exists set_attendance_sessions_updated_at on public.attendance_sessions;
create trigger set_attendance_sessions_updated_at before update on public.attendance_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_attendance_records_updated_at on public.attendance_records;
create trigger set_attendance_records_updated_at before update on public.attendance_records
for each row execute function public.set_updated_at();

drop trigger if exists set_fee_records_updated_at on public.fee_records;
create trigger set_fee_records_updated_at before update on public.fee_records
for each row execute function public.set_updated_at();

drop trigger if exists set_assessments_updated_at on public.assessments;
create trigger set_assessments_updated_at before update on public.assessments
for each row execute function public.set_updated_at();

drop trigger if exists set_progress_reports_updated_at on public.progress_reports;
create trigger set_progress_reports_updated_at before update on public.progress_reports
for each row execute function public.set_updated_at();
