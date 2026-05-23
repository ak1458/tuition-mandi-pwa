-- ============================================================
-- Migration 0003: (DEPRECATED — demo seed removed for production)
--
-- This migration historically seeded demo teacher / students /
-- batches / attendance / fees / assessments / progress reports onto
-- the FIRST user in auth.users for marketing screenshots.
--
-- Seeding demo data into a production DB is a launch blocker, so the
-- body has been intentionally emptied. Migration 0013 deletes any
-- rows previously inserted by this seed.
--
-- Do NOT add seed data here. If you need fixtures for a fresh dev DB
-- run a separate manual script.
-- ============================================================

-- intentionally no-op
SELECT 1;
