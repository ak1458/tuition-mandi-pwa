-- ============================================================
-- Migration 0012: Production hardening
-- Adds:
--   - DB-side rate limiting triggers on parent_ratings and parent_inquiries
--   - URL scheme CHECK on profile_photo_url (https only)
--   - bio length, experience_years, pincode CHECK constraints
--   - profiles.consent_accepted_at + profiles.is_age_verified (DPDP)
--   - prevent_client_plan_tampering tightened to allow only service_role
-- ============================================================

-- ----------------------------------------------------------
-- 1. profiles: consent + age verification columns (DPDP Act 2023)
-- ----------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_age_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_version text;


-- ----------------------------------------------------------
-- 2. teacher_profiles: validation CHECKs
-- ----------------------------------------------------------

-- profile_photo_url: must be https:// or data:image/ if present.
ALTER TABLE public.teacher_profiles
  DROP CONSTRAINT IF EXISTS teacher_profiles_photo_url_scheme_check;

ALTER TABLE public.teacher_profiles
  ADD CONSTRAINT teacher_profiles_photo_url_scheme_check
  CHECK (
    profile_photo_url IS NULL
    OR profile_photo_url ~* '^https://'
    OR profile_photo_url ~* '^data:image/(png|jpe?g|webp|gif);base64,'
  );

-- bio length cap (prevents 10MB blobs).
ALTER TABLE public.teacher_profiles
  DROP CONSTRAINT IF EXISTS teacher_profiles_bio_length_check;

ALTER TABLE public.teacher_profiles
  ADD CONSTRAINT teacher_profiles_bio_length_check
  CHECK (bio IS NULL OR length(bio) <= 1000);

-- experience_years upper bound (sanity).
ALTER TABLE public.teacher_profiles
  DROP CONSTRAINT IF EXISTS teacher_profiles_experience_check;

ALTER TABLE public.teacher_profiles
  ADD CONSTRAINT teacher_profiles_experience_check
  CHECK (experience_years IS NULL OR (experience_years >= 0 AND experience_years <= 80));

-- pincode: 6 digits, first digit 1-8 (Indian PIN format).
ALTER TABLE public.teacher_profiles
  DROP CONSTRAINT IF EXISTS teacher_profiles_pincode_check;

ALTER TABLE public.teacher_profiles
  ADD CONSTRAINT teacher_profiles_pincode_check
  CHECK (pincode IS NULL OR pincode ~ '^[1-8]\d{5}$');

-- full_name length cap.
ALTER TABLE public.teacher_profiles
  DROP CONSTRAINT IF EXISTS teacher_profiles_full_name_length_check;

ALTER TABLE public.teacher_profiles
  ADD CONSTRAINT teacher_profiles_full_name_length_check
  CHECK (length(trim(full_name)) BETWEEN 2 AND 120);


-- ----------------------------------------------------------
-- 3. Server-side rate limiting trigger for parent_ratings
-- Limit: 3 ratings per parent_phone per teacher_profile_id per 24h
--        AND  10 ratings per parent_phone across all teachers per 24h
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_rating_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  per_teacher_count integer;
  per_phone_count integer;
  fingerprint_value text;
BEGIN
  -- Use parent_phone as fingerprint; fall back to a row-level fingerprint.
  fingerprint_value := coalesce(NEW.parent_phone, 'anon');

  -- Per-teacher limit
  SELECT count(*) INTO per_teacher_count
  FROM public.parent_ratings
  WHERE teacher_profile_id = NEW.teacher_profile_id
    AND coalesce(parent_phone, 'anon') = fingerprint_value
    AND created_at > now() - interval '24 hours';

  IF per_teacher_count >= 3 THEN
    RAISE EXCEPTION 'RATE_LIMIT_RATING_PER_TEACHER'
      USING HINT = 'Aap is teacher ko 24 ghante mein 3 baar rate kar chuke hain.';
  END IF;

  -- Global per-phone limit
  SELECT count(*) INTO per_phone_count
  FROM public.parent_ratings
  WHERE coalesce(parent_phone, 'anon') = fingerprint_value
    AND created_at > now() - interval '24 hours';

  IF per_phone_count >= 10 THEN
    RAISE EXCEPTION 'RATE_LIMIT_RATING_PER_PHONE'
      USING HINT = 'Bahut zyada reviews submit ho gayi hain. Kal phir try karein.';
  END IF;

  -- Log to rate_limit_log (best-effort; ignore failures)
  BEGIN
    INSERT INTO public.rate_limit_log (action_type, fingerprint)
    VALUES ('parent_rating', fingerprint_value);
  EXCEPTION WHEN OTHERS THEN
    -- Don't block insert if logging fails
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_rating_rate_limit ON public.parent_ratings;
CREATE TRIGGER trg_enforce_rating_rate_limit
  BEFORE INSERT ON public.parent_ratings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rating_rate_limit();


-- ----------------------------------------------------------
-- 4. Server-side rate limiting trigger for parent_inquiries
-- Limit: 5 inquiries per parent_phone per teacher_profile_id per 24h
--        AND  20 inquiries per parent_phone across all teachers per 24h
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_inquiry_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  per_teacher_count integer;
  per_phone_count integer;
  fingerprint_value text;
BEGIN
  fingerprint_value := coalesce(NEW.parent_phone, 'anon');

  IF fingerprint_value <> 'anon' THEN
    SELECT count(*) INTO per_teacher_count
    FROM public.parent_inquiries
    WHERE teacher_profile_id = NEW.teacher_profile_id
      AND coalesce(parent_phone, 'anon') = fingerprint_value
      AND created_at > now() - interval '24 hours';

    IF per_teacher_count >= 5 THEN
      RAISE EXCEPTION 'RATE_LIMIT_INQUIRY_PER_TEACHER'
        USING HINT = 'Aap is teacher ko 24 ghante mein 5 baar inquiry bhej chuke hain.';
    END IF;

    SELECT count(*) INTO per_phone_count
    FROM public.parent_inquiries
    WHERE coalesce(parent_phone, 'anon') = fingerprint_value
      AND created_at > now() - interval '24 hours';

    IF per_phone_count >= 20 THEN
      RAISE EXCEPTION 'RATE_LIMIT_INQUIRY_PER_PHONE'
        USING HINT = 'Bahut zyada inquiries submit ho gayi hain. Kal phir try karein.';
    END IF;
  END IF;

  -- Log to rate_limit_log (best-effort)
  BEGIN
    INSERT INTO public.rate_limit_log (action_type, fingerprint)
    VALUES ('parent_inquiry', fingerprint_value);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_inquiry_rate_limit ON public.parent_inquiries;
CREATE TRIGGER trg_enforce_inquiry_rate_limit
  BEFORE INSERT ON public.parent_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.enforce_inquiry_rate_limit();


-- ----------------------------------------------------------
-- 5. Tighten prevent_client_plan_tampering
-- Allow only service_role to mutate plan / plan_expires_at.
-- (Previous version allowed anon role through.)
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_client_plan_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role'
    AND (
      NEW.plan IS DISTINCT FROM OLD.plan
      OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
    ) THEN
    RAISE EXCEPTION 'PLAN_FIELDS_READ_ONLY';
  END IF;

  RETURN NEW;
END;
$$;


-- ----------------------------------------------------------
-- 6. Update handle_new_user to capture DPDP consent + age verification
-- from user_metadata at signup time.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_consent_at text;
  meta_age_verified text;
  meta_terms_version text;
  parsed_consent_at timestamptz;
  parsed_age_verified boolean;
BEGIN
  meta_consent_at := new.raw_user_meta_data->>'dpdp_consent_at';
  meta_age_verified := new.raw_user_meta_data->>'is_age_verified';
  meta_terms_version := new.raw_user_meta_data->>'terms_version';

  BEGIN
    parsed_consent_at := meta_consent_at::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    parsed_consent_at := NULL;
  END;

  parsed_age_verified := lower(coalesce(meta_age_verified, '')) IN ('true', 't', '1', 'yes');

  INSERT INTO public.profiles (
    id,
    full_name,
    phone_e164,
    email,
    consent_accepted_at,
    is_age_verified,
    terms_version
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Teacher'),
    new.phone,
    new.email,
    parsed_consent_at,
    parsed_age_verified,
    meta_terms_version
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done.
