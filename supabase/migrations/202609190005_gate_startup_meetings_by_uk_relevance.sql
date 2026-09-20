-- Prevent unvetted potential business meetings appearing to startups.
--
-- This migration is intentionally fail-closed:
-- every existing meeting starts as pending_review and is hidden from startups
-- until an LVCN admin records UK operating presence and startup-specific fit.

BEGIN;

ALTER TABLE public.potential_meetings
  ADD COLUMN IF NOT EXISTS uk_relevance_status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS uk_presence_type text,
  ADD COLUMN IF NOT EXISTS uk_presence_location text,
  ADD COLUMN IF NOT EXISTS uk_evidence_url text,
  ADD COLUMN IF NOT EXISTS uk_fit_rationale text,
  ADD COLUMN IF NOT EXISTS uk_review_note text,
  ADD COLUMN IF NOT EXISTS uk_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS uk_reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.potential_meetings
  DROP CONSTRAINT IF EXISTS potential_meetings_uk_relevance_status_check,
  ADD CONSTRAINT potential_meetings_uk_relevance_status_check
    CHECK (uk_relevance_status IN ('pending_review', 'approved', 'excluded')),
  DROP CONSTRAINT IF EXISTS potential_meetings_uk_presence_type_check,
  ADD CONSTRAINT potential_meetings_uk_presence_type_check
    CHECK (
      uk_presence_type IS NULL
      OR uk_presence_type IN ('headquarters', 'office', 'subsidiary', 'other_uk_operating_presence')
    ),
  DROP CONSTRAINT IF EXISTS potential_meetings_approved_uk_evidence_check,
  ADD CONSTRAINT potential_meetings_approved_uk_evidence_check
    CHECK (
      uk_relevance_status <> 'approved'
      OR (
        uk_presence_type IS NOT NULL
        AND nullif(trim(uk_presence_location), '') IS NOT NULL
        AND nullif(trim(uk_evidence_url), '') IS NOT NULL
        AND nullif(trim(uk_fit_rationale), '') IS NOT NULL
        AND uk_reviewed_at IS NOT NULL
      )
    );

CREATE INDEX IF NOT EXISTS potential_meetings_uk_relevance_status_idx
  ON public.potential_meetings (uk_relevance_status);

-- The current startup policy exposes every row assigned to the startup,
-- including generic drafts and placeholder rows. Replace it with an approval gate.
DROP POLICY IF EXISTS "startups see their potential meetings" ON public.potential_meetings;
DROP POLICY IF EXISTS "startups see approved UK potential meetings" ON public.potential_meetings;

CREATE POLICY "startups see approved UK potential meetings"
  ON public.potential_meetings
  FOR SELECT
  TO authenticated
  USING (
    organisation_id = public.my_organisation_id()
    AND uk_relevance_status = 'approved'
  );

-- Also hide old/new inbox notifications for meetings that have not passed review.
DROP POLICY IF EXISTS "startup members see their updates" ON public.startup_updates;

CREATE POLICY "startup members see approved meeting updates"
  ON public.startup_updates
  FOR SELECT
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'startup_member'
          AND profiles.organisation_id = startup_updates.organisation_id
      )
    )
    AND (
      potential_meeting_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.potential_meetings pm
        WHERE pm.id = startup_updates.potential_meeting_id
          AND pm.uk_relevance_status = 'approved'
      )
    )
  );

-- Confirmed unsuitable in the current data:
-- Andreessen Horowitz is assigned to Jiro/Dropshot AI as a generic draft.
-- Its current official office list contains no UK office.
UPDATE public.potential_meetings
SET
  uk_relevance_status = 'excluded',
  uk_review_note = 'Excluded: no UK office is listed by the institution, and no startup-specific UK meeting route or fit evidence was recorded.',
  uk_reviewed_at = now()
WHERE institution_name = 'Andreessen Horowitz';

COMMIT;

-- Approve only after verifying both UK presence and a concrete reason this startup
-- should meet this institution. Run one statement per approved meeting:
--
-- UPDATE public.potential_meetings
-- SET
--   uk_relevance_status = 'approved',
--   uk_presence_type = 'office',
--   uk_presence_location = 'London',
--   uk_evidence_url = 'https://institution.example/contact-or-office-page',
--   uk_fit_rationale = 'Specific UK-relevant reason this institution should meet this startup.',
--   uk_review_note = 'Verified from the institution website on 19 September 2026.',
--   uk_reviewed_at = now(),
--   uk_reviewed_by = auth.uid()
-- WHERE id = '<meeting UUID>';

-- Review queue for LVCN admins:
--
-- SELECT
--   o.name AS startup,
--   pm.institution_name,
--   pm.category,
--   pm.status,
--   pm.location,
--   pm.external_url,
--   pm.uk_relevance_status
-- FROM public.potential_meetings pm
-- JOIN public.organisations o ON o.id = pm.organisation_id
-- WHERE pm.uk_relevance_status = 'pending_review'
-- ORDER BY o.name, pm.institution_name;
