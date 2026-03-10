do $$
declare
  teacher_id uuid;
  batch_a uuid := '10000000-0000-4000-8000-000000000001';
  batch_b uuid := '10000000-0000-4000-8000-000000000002';
  s1 uuid := '20000000-0000-4000-8000-000000000001';
  s2 uuid := '20000000-0000-4000-8000-000000000002';
  s3 uuid := '20000000-0000-4000-8000-000000000003';
  s4 uuid := '20000000-0000-4000-8000-000000000004';
  s5 uuid := '20000000-0000-4000-8000-000000000005';
  s6 uuid := '20000000-0000-4000-8000-000000000006';
  s7 uuid := '20000000-0000-4000-8000-000000000007';
  s8 uuid := '20000000-0000-4000-8000-000000000008';
  current_month date := date_trunc('month', current_date)::date;
  previous_month date := (date_trunc('month', current_date) - interval '1 month')::date;
  day_offset int;
  attendance_day date;
  session_a uuid;
  session_b uuid;
begin
  select id into teacher_id
  from auth.users
  order by created_at asc
  limit 1;

  if teacher_id is null then
    raise notice 'Seed skipped: no auth.users row found yet.';
    return;
  end if;

  insert into public.profiles (id, full_name, phone_e164, email, locale, timezone)
  values (teacher_id, 'Kavita Singh', '+919876543210', 'kavita.teacher@example.com', 'hi-IN', 'Asia/Kolkata')
  on conflict (id) do update
    set full_name = excluded.full_name,
        phone_e164 = excluded.phone_e164,
        email = excluded.email,
        locale = excluded.locale,
        timezone = excluded.timezone;

  insert into public.batches (id, teacher_id, name, class_label, subject, is_active)
  values
    (batch_a, teacher_id, 'Batch A', 'Class 10', 'Maths', true),
    (batch_b, teacher_id, 'Batch B', 'Class 9', 'Science', true)
  on conflict (id) do update
    set teacher_id = excluded.teacher_id,
        name = excluded.name,
        class_label = excluded.class_label,
        subject = excluded.subject,
        is_active = excluded.is_active;

  insert into public.students (id, teacher_id, full_name, class_label, subject, monthly_fee, guardian_phone, is_active)
  values
    (s1, teacher_id, 'Priya Sharma', 'Class 10', 'Maths', 1500, '+919810000001', true),
    (s2, teacher_id, 'Rahul Verma', 'Class 10', 'Maths', 1500, '+919810000002', true),
    (s3, teacher_id, 'Anjali Singh', 'Class 10', 'Maths', 1500, '+919810000003', true),
    (s4, teacher_id, 'Rohan Gupta', 'Class 10', 'Maths', 1500, null, true),
    (s5, teacher_id, 'Nisha Yadav', 'Class 9', 'Science', 1200, '+919810000005', true),
    (s6, teacher_id, 'Aman Mishra', 'Class 9', 'Science', 1200, '+919810000006', true),
    (s7, teacher_id, 'Sana Khan', 'Class 9', 'Science', 1200, '+919810000007', true),
    (s8, teacher_id, 'Karan Patel', 'Class 9', 'Science', 1200, '+919810000008', true)
  on conflict (id) do update
    set teacher_id = excluded.teacher_id,
        full_name = excluded.full_name,
        class_label = excluded.class_label,
        subject = excluded.subject,
        monthly_fee = excluded.monthly_fee,
        guardian_phone = excluded.guardian_phone,
        is_active = excluded.is_active;

  insert into public.batch_students (teacher_id, batch_id, student_id)
  values
    (teacher_id, batch_a, s1),
    (teacher_id, batch_a, s2),
    (teacher_id, batch_a, s3),
    (teacher_id, batch_a, s4),
    (teacher_id, batch_b, s5),
    (teacher_id, batch_b, s6),
    (teacher_id, batch_b, s7),
    (teacher_id, batch_b, s8)
  on conflict (batch_id, student_id) do update
    set teacher_id = excluded.teacher_id;

  for day_offset in 0..29 loop
    attendance_day := current_date - day_offset;

    insert into public.attendance_sessions (teacher_id, batch_id, session_date)
    values (teacher_id, batch_a, attendance_day)
    on conflict (batch_id, session_date) do update
      set teacher_id = excluded.teacher_id
    returning id into session_a;

    insert into public.attendance_sessions (teacher_id, batch_id, session_date)
    values (teacher_id, batch_b, attendance_day)
    on conflict (batch_id, session_date) do update
      set teacher_id = excluded.teacher_id
    returning id into session_b;

    insert into public.attendance_records (teacher_id, session_id, student_id, status)
    values
      (teacher_id, session_a, s1, 'present'),
      (teacher_id, session_a, s2, 'absent'),
      (teacher_id, session_a, s3, case when mod(day_offset, 2) = 0 then 'present' else 'absent' end),
      (teacher_id, session_a, s4, case when mod(day_offset, 3) = 0 then 'absent' else 'present' end),
      (teacher_id, session_b, s5, case when mod(day_offset, 4) = 0 then 'absent' else 'present' end),
      (teacher_id, session_b, s6, case when mod(day_offset, 5) = 0 then 'absent' else 'present' end),
      (teacher_id, session_b, s7, case when mod(day_offset, 3) = 0 then 'present' else 'absent' end),
      (teacher_id, session_b, s8, case when mod(day_offset, 2) = 1 then 'present' else 'absent' end)
    on conflict (session_id, student_id) do update
      set status = excluded.status,
          marked_at = now(),
          teacher_id = excluded.teacher_id;
  end loop;

  insert into public.fee_records (teacher_id, student_id, fee_month, amount_due, amount_paid, status, paid_on, notes)
  values
    (teacher_id, s1, current_month, 1500, 1500, 'paid', current_date - 2, 'Paid via UPI'),
    (teacher_id, s2, current_month, 1500, 0, 'pending', null, 'Reminder due'),
    (teacher_id, s3, current_month, 1500, 800, 'partial', null, 'Part payment'),
    (teacher_id, s4, current_month, 1500, 1500, 'paid', current_date - 3, null),
    (teacher_id, s5, current_month, 1200, 0, 'pending', null, null),
    (teacher_id, s6, current_month, 1200, 600, 'partial', null, null),
    (teacher_id, s7, current_month, 1200, 1200, 'paid', current_date - 1, null),
    (teacher_id, s8, current_month, 1200, 0, 'pending', null, null),
    (teacher_id, s1, previous_month, 1500, 1500, 'paid', previous_month + 8, 'Previous month complete'),
    (teacher_id, s2, previous_month, 1500, 1500, 'paid', previous_month + 9, 'Previous month complete')
  on conflict (student_id, fee_month) do update
    set amount_due = excluded.amount_due,
        amount_paid = excluded.amount_paid,
        status = excluded.status,
        paid_on = excluded.paid_on,
        notes = excluded.notes,
        teacher_id = excluded.teacher_id;

  insert into public.assessments (id, teacher_id, student_id, assessment_date, title, score, max_score)
  values
    ('50000000-0000-4000-8000-000000000001', teacher_id, s1, current_date - 20, 'Algebra Test 1', 87, 100),
    ('50000000-0000-4000-8000-000000000002', teacher_id, s1, current_date - 10, 'Geometry Quiz', 90, 100),
    ('50000000-0000-4000-8000-000000000003', teacher_id, s2, current_date - 18, 'Algebra Test 1', 42, 100),
    ('50000000-0000-4000-8000-000000000004', teacher_id, s3, current_date - 12, 'Algebra Test 2', 72, 100),
    ('50000000-0000-4000-8000-000000000005', teacher_id, s4, current_date - 11, 'Geometry Quiz', 68, 100),
    ('50000000-0000-4000-8000-000000000006', teacher_id, s5, current_date - 15, 'Science Test', 79, 100),
    ('50000000-0000-4000-8000-000000000007', teacher_id, s6, current_date - 9, 'Chemistry Quiz', 65, 100),
    ('50000000-0000-4000-8000-000000000008', teacher_id, s7, current_date - 8, 'Physics Quiz', 74, 100)
  on conflict (id) do update
    set score = excluded.score,
        max_score = excluded.max_score,
        assessment_date = excluded.assessment_date,
        title = excluded.title,
        teacher_id = excluded.teacher_id,
        student_id = excluded.student_id;

  insert into public.progress_reports (
    id,
    teacher_id,
    student_id,
    report_month,
    attendance_percent,
    avg_score,
    tests_done,
    language,
    report_text,
    generated_by,
    shared_via_whatsapp
  )
  values (
    '60000000-0000-4000-8000-000000000001',
    teacher_id,
    s1,
    current_month,
    100,
    88.5,
    2,
    'hi',
    'Priya ne is mahine bahut achha performance diya hai. Attendance 100% rahi aur test scores strong rahe. Algebra practice continue rakhein.',
    'seed_demo',
    false
  )
  on conflict (id) do update
    set report_text = excluded.report_text,
        attendance_percent = excluded.attendance_percent,
        avg_score = excluded.avg_score,
        tests_done = excluded.tests_done,
        teacher_id = excluded.teacher_id,
        student_id = excluded.student_id,
        report_month = excluded.report_month,
        generated_by = excluded.generated_by;
end;
$$;
