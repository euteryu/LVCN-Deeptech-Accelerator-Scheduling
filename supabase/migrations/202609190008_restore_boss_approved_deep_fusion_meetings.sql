-- Restore the Deep Fusion AI institutions approved by LVCN management.
-- Restored rows keep their original IDs and metadata; existing live rows are not duplicated.

BEGIN;

WITH requested(institution_name) AS (
  VALUES
  ('MD One'), ('Seraphim Space'), ('Octopus Ventures'), ('Foresight Group'), ('NATO Innovation Fund'), ('In Motion Ventures (JLR CVC)'), ('Prosus Ventures'), ('Molten Ventures'), ('GB Ventures'), ('IQ Capital'), ('Amadeus Capital Partners'), ('DASA (Defence and Security Accelerator)'), ('BAE Systems (FalconWorks)'), ('QinetiQ'), ('Thales UK'), ('Leonardo UK'), ('Chess Dynamics (Elbit Systems UK)'), ('MBDA UK'), ('Saab UK'), ('Rolls-Royce (Defence)'), ('Frazer-Nash Consultancy'), ('NSSIF'), ('Dstl'), ('NATO DIANA'), ('Cohort plc'), ('Ahren Innovation Capital'), ('Paladin Capital Group'), ('BGF Early Stage'), ('Cambridge Innovation Capital'), ('Parkwalk Advisors'), ('Atlantic Bridge'), ('AlbionVC'), ('Balderton Capital'), ('Atomico'), ('Lakestar'), ('Northzone'), ('EQT Ventures'), ('Dawn Capital'), ('Highland Europe'), ('M&G Catalyst'), ('Schroders Capital'), ('British Patient Capital'), ('Future Fund: Breakthrough'), ('SoftBank Vision Fund'), ('General Catalyst'), ('Lux Capital'), ('DCVC'), ('Eclipse'), ('Playground Global'), ('E14 Fund'), ('Longwall Ventures'), ('Northern Gritstone'), ('MMC Ventures'), ('Crane Venture Partners'), ('Entrepreneur First'), ('LocalGlobe'), ('Seedcamp'), ('Hoxton Ventures'), ('Notion Capital'), ('Kindred Capital'), ('Frontline Ventures'), ('Beringea'), ('Speedinvest'), ('OTB Ventures'), ('Zenzic'), ('HORIBA MIRA'), ('Millbrook Proving Ground'), ('Smart Mobility Living Lab'), ('Oxbotica'), ('Wayve'), ('Connected Places Catapult'), ('Teledyne e2v'), ('Plexal')
)
INSERT INTO public.potential_meetings (
  id, organisation_id, institution_name, category, status,
  proposed_starts_at, proposed_ends_at, location, external_url,
  startup_visible_note, next_action, owner_profile_id, created_by,
  created_at, updated_at, legacy_schedule_item_id,
  uk_relevance_status, uk_presence_type, uk_presence_location,
  uk_evidence_url, uk_fit_rationale, uk_review_note,
  uk_reviewed_at, uk_reviewed_by
)
SELECT
  a.id, a.organisation_id, a.institution_name, a.category, 'draft',
  a.proposed_starts_at, a.proposed_ends_at, a.location, a.external_url,
  a.startup_visible_note, a.next_action, a.owner_profile_id, a.created_by,
  a.created_at, now(), a.legacy_schedule_item_id,
  'pending_review', a.uk_presence_type, a.uk_presence_location,
  a.uk_evidence_url, a.uk_fit_rationale,
  'Approved Deep Fusion AI target supplied by LVCN management.', now(), a.uk_reviewed_by
FROM public.potential_meetings_archive_20260919 a
JOIN public.organisations o ON o.id = a.organisation_id
JOIN requested r ON lower(r.institution_name) = lower(a.institution_name)
WHERE o.name = 'Deep Fusion AI'
  AND NOT EXISTS (
    SELECT 1
    FROM public.potential_meetings pm
    WHERE pm.organisation_id = a.organisation_id
      AND lower(pm.institution_name) = lower(a.institution_name)
  );

UPDATE public.potential_meetings pm
SET
  status = 'draft',
  uk_relevance_status = 'pending_review',
  uk_review_note = 'Approved Deep Fusion AI target supplied by LVCN management.',
  uk_reviewed_at = now(),
  next_action = 'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.'
FROM public.organisations o
WHERE pm.organisation_id = o.id
  AND o.name = 'Deep Fusion AI';

COMMIT;
