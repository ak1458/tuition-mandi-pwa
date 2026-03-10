-- ============================================================
-- V2 Marketplace RLS Policies
-- Migration 0008: Row Level Security for 5 new marketplace tables
-- ============================================================

-- ----------------------------------------------------------
-- teacher_profiles: Public read (active), teacher writes own
-- ----------------------------------------------------------
alter table public.teacher_profiles enable row level security;

create policy "Anyone can view active teacher profiles"
  on public.teacher_profiles for select
  using (is_active = true);

create policy "Teacher can insert own profile"
  on public.teacher_profiles for insert
  with check (teacher_id = auth.uid());

create policy "Teacher can update own profile"
  on public.teacher_profiles for update
  using (teacher_id = auth.uid());

create policy "Teacher can delete own profile"
  on public.teacher_profiles for delete
  using (teacher_id = auth.uid());


-- ----------------------------------------------------------
-- parent_ratings: Public read (verified only), anyone can insert
-- ----------------------------------------------------------
alter table public.parent_ratings enable row level security;

create policy "Anyone can read verified ratings"
  on public.parent_ratings for select
  using (is_verified = true);

create policy "Anyone can submit a rating"
  on public.parent_ratings for insert
  with check (true);


-- ----------------------------------------------------------
-- teacher_outcomes: Public read (verified), teacher inserts own
-- ----------------------------------------------------------
alter table public.teacher_outcomes enable row level security;

create policy "Anyone can view verified outcomes"
  on public.teacher_outcomes for select
  using (is_verified = true);

create policy "Teacher can insert own outcomes"
  on public.teacher_outcomes for insert
  with check (teacher_id = auth.uid());


-- ----------------------------------------------------------
-- parent_inquiries: Teacher reads own, anyone can submit
-- ----------------------------------------------------------
alter table public.parent_inquiries enable row level security;

create policy "Teacher reads own inquiries"
  on public.parent_inquiries for select
  using (
    teacher_profile_id in (
      select id from public.teacher_profiles
      where teacher_id = auth.uid()
    )
  );

create policy "Anyone can submit inquiry"
  on public.parent_inquiries for insert
  with check (true);

create policy "Teacher can update inquiry status"
  on public.parent_inquiries for update
  using (
    teacher_profile_id in (
      select id from public.teacher_profiles
      where teacher_id = auth.uid()
    )
  );


-- ----------------------------------------------------------
-- profile_boosts: Teacher manages own, public reads active
-- ----------------------------------------------------------
alter table public.profile_boosts enable row level security;

create policy "Teacher can manage own boosts"
  on public.profile_boosts for all
  using (teacher_id = auth.uid());

create policy "Public can read active boosts"
  on public.profile_boosts for select
  using (is_active = true and expires_at > now());
