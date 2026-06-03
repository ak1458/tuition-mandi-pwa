-- ============================================================
-- Migration 0017: RLS performance — wrap auth.uid() in a subselect
--
-- Source: Supabase performance advisors (2026-06-03)
--   - 0003 auth_rls_initplan  (45 policies)
--   - 0001 unindexed_foreign_keys (3)
--
-- Problem (auth_rls_initplan):
--   Policies written as `teacher_id = auth.uid()` re-evaluate auth.uid()
--   once PER ROW. Wrapping it as `(select auth.uid())` lets Postgres
--   evaluate it ONCE per query (InitPlan), which is dramatically faster on
--   large result sets. Semantics are identical — same value, same access.
--
-- Safety:
--   Each policy is dropped and recreated with byte-identical logic except
--   for the subselect wrapper. DDL was generated directly from the live
--   catalog (pg_policies) so it matches the current definitions exactly.
--   The DB is currently empty (0 rows) so there is no data-access risk;
--   still, REVIEW and prefer applying to a branch/staging first, then:
--     npx supabase db push
--
-- NOT included (need semantic review, see REFACTOR-PLAN.md P2):
--   - multiple_permissive_policies (12): overlapping public-read + owner
--     policies. Merging changes meaning — do deliberately, not mechanically.
--   - unused_index (26): all "unused" only because the DB is empty. Re-check
--     after real traffic before dropping anything.
-- ============================================================

-- ---------- assessments ----------
DROP POLICY IF EXISTS assessments_delete_own ON public.assessments;
CREATE POLICY assessments_delete_own ON public.assessments AS PERMISSIVE FOR DELETE TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS assessments_insert_own ON public.assessments;
CREATE POLICY assessments_insert_own ON public.assessments AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS assessments_select_own ON public.assessments;
CREATE POLICY assessments_select_own ON public.assessments AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS assessments_update_own ON public.assessments;
CREATE POLICY assessments_update_own ON public.assessments AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_id = (select auth.uid())))
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ---------- attendance_records ----------
DROP POLICY IF EXISTS attendance_records_delete_own ON public.attendance_records;
CREATE POLICY attendance_records_delete_own ON public.attendance_records AS PERMISSIVE FOR DELETE TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS attendance_records_insert_own ON public.attendance_records;
CREATE POLICY attendance_records_insert_own ON public.attendance_records AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS attendance_records_select_own ON public.attendance_records;
CREATE POLICY attendance_records_select_own ON public.attendance_records AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS attendance_records_update_own ON public.attendance_records;
CREATE POLICY attendance_records_update_own ON public.attendance_records AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_id = (select auth.uid())))
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ---------- attendance_sessions ----------
DROP POLICY IF EXISTS attendance_sessions_delete_own ON public.attendance_sessions;
CREATE POLICY attendance_sessions_delete_own ON public.attendance_sessions AS PERMISSIVE FOR DELETE TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS attendance_sessions_insert_own ON public.attendance_sessions;
CREATE POLICY attendance_sessions_insert_own ON public.attendance_sessions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS attendance_sessions_select_own ON public.attendance_sessions;
CREATE POLICY attendance_sessions_select_own ON public.attendance_sessions AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS attendance_sessions_update_own ON public.attendance_sessions;
CREATE POLICY attendance_sessions_update_own ON public.attendance_sessions AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_id = (select auth.uid())))
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ---------- batch_students ----------
DROP POLICY IF EXISTS batch_students_delete_own ON public.batch_students;
CREATE POLICY batch_students_delete_own ON public.batch_students AS PERMISSIVE FOR DELETE TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS batch_students_insert_own ON public.batch_students;
CREATE POLICY batch_students_insert_own ON public.batch_students AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS batch_students_select_own ON public.batch_students;
CREATE POLICY batch_students_select_own ON public.batch_students AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS batch_students_update_own ON public.batch_students;
CREATE POLICY batch_students_update_own ON public.batch_students AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_id = (select auth.uid())))
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ---------- batches ----------
DROP POLICY IF EXISTS batches_delete_own ON public.batches;
CREATE POLICY batches_delete_own ON public.batches AS PERMISSIVE FOR DELETE TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS batches_insert_own ON public.batches;
CREATE POLICY batches_insert_own ON public.batches AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS batches_select_own ON public.batches;
CREATE POLICY batches_select_own ON public.batches AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS batches_update_own ON public.batches;
CREATE POLICY batches_update_own ON public.batches AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_id = (select auth.uid())))
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ---------- fee_records ----------
DROP POLICY IF EXISTS fee_records_delete_own ON public.fee_records;
CREATE POLICY fee_records_delete_own ON public.fee_records AS PERMISSIVE FOR DELETE TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS fee_records_insert_own ON public.fee_records;
CREATE POLICY fee_records_insert_own ON public.fee_records AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS fee_records_select_own ON public.fee_records;
CREATE POLICY fee_records_select_own ON public.fee_records AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS fee_records_update_own ON public.fee_records;
CREATE POLICY fee_records_update_own ON public.fee_records AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_id = (select auth.uid())))
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ---------- parent_inquiries ----------
DROP POLICY IF EXISTS "Teacher reads own inquiries" ON public.parent_inquiries;
CREATE POLICY "Teacher reads own inquiries" ON public.parent_inquiries AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_profile_id IN ( SELECT teacher_profiles.id
     FROM teacher_profiles
    WHERE (teacher_profiles.teacher_id = (select auth.uid())))));

DROP POLICY IF EXISTS "Teacher can update inquiry status" ON public.parent_inquiries;
CREATE POLICY "Teacher can update inquiry status" ON public.parent_inquiries AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_profile_id IN ( SELECT teacher_profiles.id
     FROM teacher_profiles
    WHERE (teacher_profiles.teacher_id = (select auth.uid())))))
  WITH CHECK ((teacher_profile_id IN ( SELECT teacher_profiles.id
     FROM teacher_profiles
    WHERE (teacher_profiles.teacher_id = (select auth.uid())))));

-- ---------- plan_payment_receipts ----------
DROP POLICY IF EXISTS plan_payment_receipts_select_own ON public.plan_payment_receipts;
CREATE POLICY plan_payment_receipts_select_own ON public.plan_payment_receipts AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

-- ---------- profile_boosts ----------
DROP POLICY IF EXISTS "Teacher can manage own boosts" ON public.profile_boosts;
CREATE POLICY "Teacher can manage own boosts" ON public.profile_boosts AS PERMISSIVE FOR ALL TO public
  USING ((teacher_id = (select auth.uid())));

-- ---------- profiles ----------
DROP POLICY IF EXISTS profiles_delete_own ON public.profiles;
CREATE POLICY profiles_delete_own ON public.profiles AS PERMISSIVE FOR DELETE TO public
  USING ((id = (select auth.uid())));

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((id = (select auth.uid())));

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles AS PERMISSIVE FOR SELECT TO public
  USING ((id = (select auth.uid())));

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((id = (select auth.uid())))
  WITH CHECK ((id = (select auth.uid())));

-- ---------- progress_reports ----------
DROP POLICY IF EXISTS progress_reports_delete_own ON public.progress_reports;
CREATE POLICY progress_reports_delete_own ON public.progress_reports AS PERMISSIVE FOR DELETE TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS progress_reports_insert_own ON public.progress_reports;
CREATE POLICY progress_reports_insert_own ON public.progress_reports AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS progress_reports_select_own ON public.progress_reports;
CREATE POLICY progress_reports_select_own ON public.progress_reports AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS progress_reports_update_own ON public.progress_reports;
CREATE POLICY progress_reports_update_own ON public.progress_reports AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_id = (select auth.uid())))
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ---------- students ----------
DROP POLICY IF EXISTS students_delete_own ON public.students;
CREATE POLICY students_delete_own ON public.students AS PERMISSIVE FOR DELETE TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS students_insert_own ON public.students;
CREATE POLICY students_insert_own ON public.students AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS students_select_own ON public.students;
CREATE POLICY students_select_own ON public.students AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS students_update_own ON public.students;
CREATE POLICY students_update_own ON public.students AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_id = (select auth.uid())))
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ---------- teacher_outcomes ----------
DROP POLICY IF EXISTS "Teacher can insert own outcomes" ON public.teacher_outcomes;
CREATE POLICY "Teacher can insert own outcomes" ON public.teacher_outcomes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ---------- teacher_profiles ----------
DROP POLICY IF EXISTS "Teacher can delete own profile" ON public.teacher_profiles;
CREATE POLICY "Teacher can delete own profile" ON public.teacher_profiles AS PERMISSIVE FOR DELETE TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS "Teacher can insert own profile" ON public.teacher_profiles;
CREATE POLICY "Teacher can insert own profile" ON public.teacher_profiles AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS "Teacher can view own profile" ON public.teacher_profiles;
CREATE POLICY "Teacher can view own profile" ON public.teacher_profiles AS PERMISSIVE FOR SELECT TO public
  USING ((teacher_id = (select auth.uid())));

DROP POLICY IF EXISTS "Teacher can update own profile" ON public.teacher_profiles;
CREATE POLICY "Teacher can update own profile" ON public.teacher_profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((teacher_id = (select auth.uid())))
  WITH CHECK ((teacher_id = (select auth.uid())));

-- ============================================================
-- Covering indexes for unindexed foreign keys (advisor 0001)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profile_boosts_teacher_id   ON public.profile_boosts (teacher_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_student_id ON public.progress_reports (student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_outcomes_teacher_id ON public.teacher_outcomes (teacher_id);
