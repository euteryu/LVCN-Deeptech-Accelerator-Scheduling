-- Correct the startup-rating workflow:
--   1. Startups see every curated potential institution assigned to them.
--   2. Uncurated generated rows are archived and removed from the rating list.
--   3. The original per-startup visibility policy is restored.
--
-- This preserves the removed records in archive tables before deleting the
-- live copies. Diphy, Recon Labs and PEN Ventures are intentionally untouched.

BEGIN;

CREATE TABLE IF NOT EXISTS public.potential_meetings_archive_20260919
  AS TABLE public.potential_meetings WITH NO DATA;

ALTER TABLE public.potential_meetings_archive_20260919
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archive_reason text NOT NULL DEFAULT 'Uncurated generated meeting removed from startup rating list.';

CREATE TABLE IF NOT EXISTS public.potential_meeting_admin_details_archive_20260919
  AS TABLE public.potential_meeting_admin_details WITH NO DATA;

ALTER TABLE public.potential_meeting_admin_details_archive_20260919
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.potential_meeting_decisions_archive_20260919
  AS TABLE public.potential_meeting_decisions WITH NO DATA;

ALTER TABLE public.potential_meeting_decisions_archive_20260919
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.startup_updates_archive_20260919
  AS TABLE public.startup_updates WITH NO DATA;

ALTER TABLE public.startup_updates_archive_20260919
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NOT NULL DEFAULT now();

WITH rows_to_archive AS (
  SELECT pm.id
  FROM public.potential_meetings pm
  JOIN public.organisations o ON o.id = pm.organisation_id
  WHERE o.name IN (
    'Deep Fusion AI',
    'Dotter',
    'FUST Lab',
    'HME Square',
    'Jiro Inc. (Dropshot AI)',
    'PA Robotics (Powerauto Robotics)',
    'Seoul Labs',
    'YepBio'
  )
  AND pm.uk_relevance_status IN ('pending_review', 'excluded')
)
INSERT INTO public.potential_meeting_admin_details_archive_20260919
SELECT d.*, now()
FROM public.potential_meeting_admin_details d
JOIN rows_to_archive r ON r.id = d.potential_meeting_id;

WITH rows_to_archive AS (
  SELECT pm.id
  FROM public.potential_meetings pm
  JOIN public.organisations o ON o.id = pm.organisation_id
  WHERE o.name IN (
    'Deep Fusion AI',
    'Dotter',
    'FUST Lab',
    'HME Square',
    'Jiro Inc. (Dropshot AI)',
    'PA Robotics (Powerauto Robotics)',
    'Seoul Labs',
    'YepBio'
  )
  AND pm.uk_relevance_status IN ('pending_review', 'excluded')
)
INSERT INTO public.potential_meeting_decisions_archive_20260919
SELECT d.*, now()
FROM public.potential_meeting_decisions d
JOIN rows_to_archive r ON r.id = d.potential_meeting_id;

WITH rows_to_archive AS (
  SELECT pm.id
  FROM public.potential_meetings pm
  JOIN public.organisations o ON o.id = pm.organisation_id
  WHERE o.name IN (
    'Deep Fusion AI',
    'Dotter',
    'FUST Lab',
    'HME Square',
    'Jiro Inc. (Dropshot AI)',
    'PA Robotics (Powerauto Robotics)',
    'Seoul Labs',
    'YepBio'
  )
  AND pm.uk_relevance_status IN ('pending_review', 'excluded')
)
INSERT INTO public.startup_updates_archive_20260919
SELECT su.*, now()
FROM public.startup_updates su
JOIN rows_to_archive r ON r.id = su.potential_meeting_id;

WITH rows_to_archive AS (
  SELECT pm.*
  FROM public.potential_meetings pm
  JOIN public.organisations o ON o.id = pm.organisation_id
  WHERE o.name IN (
    'Deep Fusion AI',
    'Dotter',
    'FUST Lab',
    'HME Square',
    'Jiro Inc. (Dropshot AI)',
    'PA Robotics (Powerauto Robotics)',
    'Seoul Labs',
    'YepBio'
  )
  AND pm.uk_relevance_status IN ('pending_review', 'excluded')
)
INSERT INTO public.potential_meetings_archive_20260919
SELECT rows_to_archive.*, now(), 'Uncurated generated meeting removed from startup rating list.'
FROM rows_to_archive;

DELETE FROM public.potential_meetings pm
USING public.organisations o
WHERE pm.organisation_id = o.id
  AND o.name IN (
    'Deep Fusion AI',
    'Dotter',
    'FUST Lab',
    'HME Square',
    'Jiro Inc. (Dropshot AI)',
    'PA Robotics (Powerauto Robotics)',
    'Seoul Labs',
    'YepBio'
  )
  AND pm.uk_relevance_status IN ('pending_review', 'excluded');

DROP POLICY IF EXISTS "startups see approved UK potential meetings" ON public.potential_meetings;
DROP POLICY IF EXISTS "startups see their potential meetings" ON public.potential_meetings;

CREATE POLICY "startups see their potential meetings"
  ON public.potential_meetings
  FOR SELECT
  TO authenticated
  USING (organisation_id = public.my_organisation_id());

DROP POLICY IF EXISTS "startup members see approved meeting updates" ON public.startup_updates;
DROP POLICY IF EXISTS "startup members see their updates" ON public.startup_updates;

CREATE POLICY "startup members see their updates"
  ON public.startup_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'startup_member'
        AND profiles.organisation_id = startup_updates.organisation_id
    )
  );

COMMIT;
