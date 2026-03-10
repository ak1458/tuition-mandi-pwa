-- ============================================================
-- V2 Seed: Demo teacher profile for testing
-- Migration 0009: Inserts a demo teacher_profile using the
-- first existing user from auth.users (if any).
-- ============================================================

-- Insert demo teacher profile (only if a user exists and no profile yet)
insert into public.teacher_profiles (
  teacher_id,
  full_name,
  phone_e164,
  bio,
  city,
  district,
  state,
  area_mohalla,
  pincode,
  subjects,
  classes_taught,
  medium,
  experience_years,
  time_slots,
  home_tuition,
  online_tuition,
  fee_min,
  fee_max,
  fee_negotiable,
  is_verified,
  is_active,
  is_open_to_school,
  plan,
  total_students_taught
)
select
  u.id,
  coalesce(p.full_name, 'Demo Teacher'),
  coalesce(p.phone_e164, '+919876543210'),
  'Experienced tuition teacher with 6+ years of teaching Mathematics and Science to Class 9-12 students.',
  'Gonda',
  'Gonda',
  'Uttar Pradesh',
  'Civil Lines',
  '271001',
  array['Mathematics', 'Science', 'Physics'],
  array['Class 9', 'Class 10', 'Class 11', 'Class 12'],
  'Hindi',
  6,
  array['Subah 6-8 AM', 'Shaam 4-6 PM', 'Shaam 6-8 PM'],
  true,
  false,
  500,
  1000,
  true,
  true,
  true,
  false,
  'free',
  45
from auth.users u
left join public.profiles p on p.id = u.id
where not exists (
  select 1 from public.teacher_profiles tp where tp.teacher_id = u.id
)
limit 1;

-- Insert demo parent ratings for the demo teacher (verified for visibility)
insert into public.parent_ratings (
  teacher_profile_id,
  parent_name,
  parent_phone,
  student_class,
  subject_taught,
  rating,
  review_text,
  is_verified,
  verified_at
)
select
  tp.id,
  unnest(array['Rajesh Kumar', 'Sunita Devi', 'Amit Sharma']),
  unnest(array['+919111111111', '+919222222222', '+919333333333']),
  unnest(array['Class 10', 'Class 9', 'Class 12']),
  unnest(array['Mathematics', 'Science', 'Physics']),
  unnest(array[5, 4, 5]),
  unnest(array[
    'Bahut acche teacher hain. Mere bete ka Maths mein bohot improvement hua.',
    'Science bohot acche se samjhate hain. Bachche ko ab interest aa gaya.',
    'Physics ke liye best teacher Gonda mein. Board exam mein 95% aaye.'
  ]),
  true,
  now()
from public.teacher_profiles tp
limit 1;

-- Insert demo teacher outcome
insert into public.teacher_outcomes (
  teacher_profile_id,
  teacher_id,
  academic_year,
  total_students,
  students_above_75_percent,
  students_above_90_percent,
  board_toppers,
  subject,
  class_level,
  is_verified
)
select
  tp.id,
  tp.teacher_id,
  '2025-26',
  12,
  9,
  3,
  1,
  'Mathematics',
  'Class 10',
  true
from public.teacher_profiles tp
limit 1;
