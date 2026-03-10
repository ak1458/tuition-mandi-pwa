-- ============================================================
-- V2 Marketplace Tables — Takhti Hyperlocal Teacher Discovery
-- Migration 0007: 5 new tables + indexes + triggers
-- Existing V1 tables are NOT modified.
-- ============================================================

-- ----------------------------------------------------------
-- Table 1: teacher_profiles
-- Teacher ka public marketplace profile
-- ----------------------------------------------------------
create table if not exists public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,

  -- Basic Info
  full_name text not null,
  phone_e164 text not null,
  profile_photo_url text,
  bio text,

  -- Location (hyperlocal search ke liye critical)
  city text not null,
  district text not null,
  state text not null default 'Uttar Pradesh',
  area_mohalla text,
  pincode text,

  -- Teaching Details
  subjects text[] not null,
  classes_taught text[] not null,
  medium text default 'Hindi',
  experience_years integer default 0,
  time_slots text[],
  home_tuition boolean default true,
  online_tuition boolean default false,

  -- Fees
  fee_min integer,
  fee_max integer,
  fee_negotiable boolean default true,

  -- Platform Status
  is_verified boolean default false,
  is_active boolean default true,
  is_open_to_school boolean default false,
  plan text default 'free' check (plan in ('free', 'pro')),
  plan_expires_at timestamptz,

  -- Search Optimization
  search_vector tsvector,
  total_students_taught integer default 0,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(teacher_id)
);

-- Indexes for teacher_profiles
create index if not exists teacher_profiles_city_idx
  on public.teacher_profiles(city);

create index if not exists teacher_profiles_district_idx
  on public.teacher_profiles(district);

create index if not exists teacher_profiles_search_idx
  on public.teacher_profiles using gin(search_vector);

create index if not exists teacher_profiles_subjects_idx
  on public.teacher_profiles using gin(subjects);

create index if not exists teacher_profiles_classes_idx
  on public.teacher_profiles using gin(classes_taught);

-- Auto-update search vector on insert/update
create or replace function public.update_teacher_search_vector()
returns trigger as $$
begin
  new.search_vector := to_tsvector('english',
    coalesce(new.full_name, '') || ' ' ||
    coalesce(new.city, '') || ' ' ||
    coalesce(new.district, '') || ' ' ||
    coalesce(new.area_mohalla, '') || ' ' ||
    coalesce(array_to_string(new.subjects, ' '), '') || ' ' ||
    coalesce(array_to_string(new.classes_taught, ' '), '')
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists teacher_search_vector_trigger on public.teacher_profiles;
create trigger teacher_search_vector_trigger
before insert or update on public.teacher_profiles
for each row execute function public.update_teacher_search_vector();

-- Auto-update updated_at
drop trigger if exists set_teacher_profiles_updated_at on public.teacher_profiles;
create trigger set_teacher_profiles_updated_at
before update on public.teacher_profiles
for each row execute function public.set_updated_at();


-- ----------------------------------------------------------
-- Table 2: parent_ratings
-- Parents rate teachers (no auth needed to submit)
-- ----------------------------------------------------------
create table if not exists public.parent_ratings (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references public.teacher_profiles(id) on delete cascade,

  -- Parent info
  parent_name text not null,
  parent_phone text not null,
  student_class text not null,
  subject_taught text not null,

  -- Rating
  rating integer not null check (rating between 1 and 5),
  review_text text,

  -- Verification
  is_verified boolean default false,
  verified_at timestamptz,

  -- Anti-spam
  ip_address text,

  created_at timestamptz not null default now()
);

create index if not exists parent_ratings_teacher_idx
  on public.parent_ratings(teacher_profile_id);


-- ----------------------------------------------------------
-- Table 3: teacher_outcomes
-- "Takhti Verified" badge ka source data
-- ----------------------------------------------------------
create table if not exists public.teacher_outcomes (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references public.teacher_profiles(id) on delete cascade,
  teacher_id uuid not null references auth.users(id),

  -- Academic year
  academic_year text not null,

  -- Outcome data
  total_students integer not null,
  students_above_75_percent integer default 0,
  students_above_90_percent integer default 0,
  board_toppers integer default 0,

  -- Subject specific
  subject text not null,
  class_level text not null,

  -- Verification status
  is_verified boolean default false,
  verification_note text,

  created_at timestamptz not null default now()
);

create index if not exists teacher_outcomes_profile_idx
  on public.teacher_outcomes(teacher_profile_id);


-- ----------------------------------------------------------
-- Table 4: parent_inquiries
-- Jab parent teacher ko contact kare — track karo
-- ----------------------------------------------------------
create table if not exists public.parent_inquiries (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references public.teacher_profiles(id) on delete cascade,

  -- Parent info
  parent_name text,
  parent_phone text,
  student_class text,
  subject_needed text,
  message text,

  -- Contact method used
  contact_method text default 'whatsapp',

  -- Status (teacher updates this)
  status text default 'new' check (status in ('new', 'contacted', 'enrolled', 'not_interested')),

  created_at timestamptz not null default now()
);

create index if not exists parent_inquiries_teacher_idx
  on public.parent_inquiries(teacher_profile_id);


-- ----------------------------------------------------------
-- Table 5: profile_boosts
-- ₹49-99 ek baar ka boost feature
-- ----------------------------------------------------------
create table if not exists public.profile_boosts (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references public.teacher_profiles(id) on delete cascade,
  teacher_id uuid not null references auth.users(id),

  boost_type text default '7day' check (boost_type in ('7day', '15day', '30day')),
  amount_paid integer,
  starts_at timestamptz default now(),
  expires_at timestamptz not null,
  razorpay_payment_id text,
  is_active boolean default true,

  created_at timestamptz not null default now()
);

create index if not exists profile_boosts_teacher_idx
  on public.profile_boosts(teacher_profile_id);

create index if not exists profile_boosts_active_idx
  on public.profile_boosts(is_active, expires_at)
  where is_active = true;
