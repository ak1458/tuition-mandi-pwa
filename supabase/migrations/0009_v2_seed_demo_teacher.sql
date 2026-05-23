-- ============================================================
-- Migration 0009: (DEPRECATED — V2 demo teacher seed removed for production)
--
-- This migration historically seeded a "Demo Teacher" teacher_profiles
-- row + 3 fake parent_ratings + 1 fake teacher_outcome onto the first
-- user in auth.users.
--
-- Seeding demo marketplace data into a production DB pollutes search
-- results, so the body has been intentionally emptied. Migration 0013
-- deletes any rows previously inserted by this seed.
--
-- Do NOT add seed data here. If you need a fixture teacher profile for
-- testing, run a separate manual script.
-- ============================================================

-- intentionally no-op
SELECT 1;
