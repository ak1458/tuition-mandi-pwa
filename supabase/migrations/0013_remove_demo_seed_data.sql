-- ============================================================
-- Migration 0013: Remove demo / seed data from production
--
-- Reverses the side-effects of 0003_seed_demo_data.sql and
-- 0009_v2_seed_demo_teacher.sql by deleting the rows they inserted.
-- Identifies seed rows by:
--   - the deterministic UUIDs hard-coded in 0003 (10000000-... batches,
--     20000000-... students, 50000000-... assessments, 60000000-... reports)
--   - generated_by = 'seed_demo' on progress_reports
--   - the seed phone numbers / verification_note / hard-coded review text
--     used by 0009
--
-- Idempotent: running this on a clean DB is a no-op.
-- ============================================================

-- 0003: students. Deleting students cascades to attendance_records,
-- attendance_sessions records via student_id, fee_records, assessments,
-- progress_reports, batch_students.
DELETE FROM public.students
WHERE id IN (
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000005',
  '20000000-0000-4000-8000-000000000006',
  '20000000-0000-4000-8000-000000000007',
  '20000000-0000-4000-8000-000000000008'
);

-- 0003: batches. Cascades to attendance_sessions and batch_students.
DELETE FROM public.batches
WHERE id IN (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002'
);

-- 0003: assessments (already cascaded via student delete, but just in case
-- the deterministic IDs are still around).
DELETE FROM public.assessments
WHERE id IN (
  '50000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000003',
  '50000000-0000-4000-8000-000000000004',
  '50000000-0000-4000-8000-000000000005',
  '50000000-0000-4000-8000-000000000006',
  '50000000-0000-4000-8000-000000000007',
  '50000000-0000-4000-8000-000000000008'
);

-- 0003: progress_reports — match by deterministic id and by generated_by tag
-- (the trigger enforce_ai_report_limit specifically excludes generated_by =
-- 'seed_demo' from quota counting, so killing them is safe).
DELETE FROM public.progress_reports
WHERE id = '60000000-0000-4000-8000-000000000001'
   OR generated_by = 'seed_demo';

-- 0003: profile row "Kavita Singh" with the seed phone number. We do NOT
-- delete the auth.users row — that may be a real signed-up account. We just
-- clear the seeded full_name / phone_e164 / email so the user can fill
-- their real details on next profile setup.
UPDATE public.profiles
SET full_name = 'Teacher',
    phone_e164 = NULL,
    email = NULL
WHERE full_name = 'Kavita Singh'
  AND phone_e164 = '+919876543210'
  AND email = 'kavita.teacher@example.com';

-- 0009: parent_ratings seeded for the demo teacher. Match by the exact phone
-- numbers and review text used in the seed.
DELETE FROM public.parent_ratings
WHERE parent_phone IN ('+919111111111', '+919222222222', '+919333333333')
  AND parent_name IN ('Rajesh Kumar', 'Sunita Devi', 'Amit Sharma');

-- 0009: teacher_outcomes flagged with the seed verification_note.
DELETE FROM public.teacher_outcomes
WHERE verification_note = 'Demo verified outcome'
   OR (academic_year = '2025-26' AND total_students = 12 AND board_toppers = 1 AND subject = 'Mathematics');

-- 0009: teacher_profiles seeded as the "Demo Teacher". Match on the unique
-- combination of phone + bio + city to avoid hitting any real teacher who
-- happens to be named "Demo Teacher" by coincidence.
DELETE FROM public.teacher_profiles
WHERE phone_e164 = '+919876543210'
  AND city = 'Gonda'
  AND area_mohalla = 'Civil Lines'
  AND bio = 'Experienced tuition teacher with 6+ years of teaching Mathematics and Science to Class 9-12 students.';

-- Done.
