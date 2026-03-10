create index if not exists idx_batches_teacher_id on public.batches (teacher_id);
create index if not exists idx_students_teacher_id on public.students (teacher_id);
create index if not exists idx_batch_students_teacher_id on public.batch_students (teacher_id);
create index if not exists idx_batch_students_batch_id on public.batch_students (batch_id);
create index if not exists idx_batch_students_student_id on public.batch_students (student_id);
create index if not exists idx_attendance_sessions_teacher_id on public.attendance_sessions (teacher_id);
create index if not exists idx_attendance_sessions_batch_date on public.attendance_sessions (batch_id, session_date);
create index if not exists idx_attendance_records_teacher_id on public.attendance_records (teacher_id);
create index if not exists idx_attendance_records_student_id on public.attendance_records (student_id);
create index if not exists idx_fee_records_teacher_id on public.fee_records (teacher_id);
create index if not exists idx_fee_records_month_status on public.fee_records (fee_month, status);
create index if not exists idx_assessments_teacher_id on public.assessments (teacher_id);
create index if not exists idx_assessments_student_date on public.assessments (student_id, assessment_date);
create index if not exists idx_progress_reports_teacher_id on public.progress_reports (teacher_id);
create index if not exists idx_progress_reports_month on public.progress_reports (report_month);

alter table public.profiles enable row level security;
alter table public.batches enable row level security;
alter table public.students enable row level security;
alter table public.batch_students enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.fee_records enable row level security;
alter table public.assessments enable row level security;
alter table public.progress_reports enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
for delete using (id = auth.uid());

drop policy if exists batches_select_own on public.batches;
create policy batches_select_own on public.batches
for select using (teacher_id = auth.uid());

drop policy if exists batches_insert_own on public.batches;
create policy batches_insert_own on public.batches
for insert with check (teacher_id = auth.uid());

drop policy if exists batches_update_own on public.batches;
create policy batches_update_own on public.batches
for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists batches_delete_own on public.batches;
create policy batches_delete_own on public.batches
for delete using (teacher_id = auth.uid());

drop policy if exists students_select_own on public.students;
create policy students_select_own on public.students
for select using (teacher_id = auth.uid());

drop policy if exists students_insert_own on public.students;
create policy students_insert_own on public.students
for insert with check (teacher_id = auth.uid());

drop policy if exists students_update_own on public.students;
create policy students_update_own on public.students
for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists students_delete_own on public.students;
create policy students_delete_own on public.students
for delete using (teacher_id = auth.uid());

drop policy if exists batch_students_select_own on public.batch_students;
create policy batch_students_select_own on public.batch_students
for select using (teacher_id = auth.uid());

drop policy if exists batch_students_insert_own on public.batch_students;
create policy batch_students_insert_own on public.batch_students
for insert with check (teacher_id = auth.uid());

drop policy if exists batch_students_update_own on public.batch_students;
create policy batch_students_update_own on public.batch_students
for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists batch_students_delete_own on public.batch_students;
create policy batch_students_delete_own on public.batch_students
for delete using (teacher_id = auth.uid());

drop policy if exists attendance_sessions_select_own on public.attendance_sessions;
create policy attendance_sessions_select_own on public.attendance_sessions
for select using (teacher_id = auth.uid());

drop policy if exists attendance_sessions_insert_own on public.attendance_sessions;
create policy attendance_sessions_insert_own on public.attendance_sessions
for insert with check (teacher_id = auth.uid());

drop policy if exists attendance_sessions_update_own on public.attendance_sessions;
create policy attendance_sessions_update_own on public.attendance_sessions
for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists attendance_sessions_delete_own on public.attendance_sessions;
create policy attendance_sessions_delete_own on public.attendance_sessions
for delete using (teacher_id = auth.uid());

drop policy if exists attendance_records_select_own on public.attendance_records;
create policy attendance_records_select_own on public.attendance_records
for select using (teacher_id = auth.uid());

drop policy if exists attendance_records_insert_own on public.attendance_records;
create policy attendance_records_insert_own on public.attendance_records
for insert with check (teacher_id = auth.uid());

drop policy if exists attendance_records_update_own on public.attendance_records;
create policy attendance_records_update_own on public.attendance_records
for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists attendance_records_delete_own on public.attendance_records;
create policy attendance_records_delete_own on public.attendance_records
for delete using (teacher_id = auth.uid());

drop policy if exists fee_records_select_own on public.fee_records;
create policy fee_records_select_own on public.fee_records
for select using (teacher_id = auth.uid());

drop policy if exists fee_records_insert_own on public.fee_records;
create policy fee_records_insert_own on public.fee_records
for insert with check (teacher_id = auth.uid());

drop policy if exists fee_records_update_own on public.fee_records;
create policy fee_records_update_own on public.fee_records
for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists fee_records_delete_own on public.fee_records;
create policy fee_records_delete_own on public.fee_records
for delete using (teacher_id = auth.uid());

drop policy if exists assessments_select_own on public.assessments;
create policy assessments_select_own on public.assessments
for select using (teacher_id = auth.uid());

drop policy if exists assessments_insert_own on public.assessments;
create policy assessments_insert_own on public.assessments
for insert with check (teacher_id = auth.uid());

drop policy if exists assessments_update_own on public.assessments;
create policy assessments_update_own on public.assessments
for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists assessments_delete_own on public.assessments;
create policy assessments_delete_own on public.assessments
for delete using (teacher_id = auth.uid());

drop policy if exists progress_reports_select_own on public.progress_reports;
create policy progress_reports_select_own on public.progress_reports
for select using (teacher_id = auth.uid());

drop policy if exists progress_reports_insert_own on public.progress_reports;
create policy progress_reports_insert_own on public.progress_reports
for insert with check (teacher_id = auth.uid());

drop policy if exists progress_reports_update_own on public.progress_reports;
create policy progress_reports_update_own on public.progress_reports
for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists progress_reports_delete_own on public.progress_reports;
create policy progress_reports_delete_own on public.progress_reports
for delete using (teacher_id = auth.uid());
