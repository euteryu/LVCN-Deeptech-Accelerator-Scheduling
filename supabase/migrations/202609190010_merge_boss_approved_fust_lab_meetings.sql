-- LVCN management-approved water, climate, utility, regulatory and investment targets for FUST Lab.

BEGIN;

WITH requested(institution_name) AS (
  VALUES
  ('PiLabs'),
  ('Claire Trant (Untap Health)'),
  ('Zero Carbon Capital'),
  ('Systemiq Capital'),
  ('Clean Growth Fund'),
  ('Kiko Ventures'),
  ('Severn Trent'),
  ('Yorkshire Water'),
  ('Thames Water'),
  ('Environmental law specialist (TBD firm)'),
  ('Innovate UK'),
  ('Anglian Water'),
  ('United Utilities'),
  ('Northumbrian Water'),
  ('Scottish Water'),
  ('UKWIR (UK Water Industry Research)'),
  ('Environment Agency'),
  ('Ofwat Innovation Fund'),
  ('Voyager Ventures'),
  ('PureTerra Ventures (specialist water VC)'),
  ('Natural Ventures (water-security fund)'),
  ('Emerald Technology Ventures'),
  ('Analytic'),
  ('Breakthrough Energy Ventures'),
  ('2150'),
  ('Climate VC'),
  ('Sustainable Ventures'),
  ('Elbow Beach Capital'),
  ('OnePlanetCapital'),
  ('Octopus Ventures'),
  ('Parkwalk Advisors'),
  ('IQ Capital'),
  ('Amadeus Capital Partners'),
  ('BGF Early Stage'),
  ('Cambridge Innovation Capital'),
  ('Longwall Ventures'),
  ('Northern Gritstone'),
  ('Ahren Innovation Capital'),
  ('Eclipse'),
  ('Lowercarbon Capital'),
  ('Congruent Ventures'),
  ('Energy Impact Partners'),
  ('World Fund'),
  ('Norrsken VC'),
  ('AENU'),
  ('Extantia'),
  ('Planet A Ventures'),
  ('Blue Bear Capital'),
  ('Shell Ventures'),
  ('BP Ventures'),
  ('Equinor Ventures'),
  ('National Grid Partners'),
  ('ENGIE New Ventures'),
  ('Veolia Ventures'),
  ('SUEZ Ventures'),
  ('Xylem Innovation Labs'),
  ('Thames Water Ventures'),
  ('Severn Trent Ventures'),
  ('Anglian Water Innovation'),
  ('Yorkshire Water Innovation'),
  ('M&G Catalyst'),
  ('British Growth Partnership'),
  ('Schroders Capital'),
  ('Future Fund: Breakthrough'),
  ('NATO Innovation Fund'),
  ('Playground Global'),
  ('DCVC'),
  ('Lux Capital'),
  ('Atlantic Bridge'),
  ('AlbionVC'),
  ('Foresight Group'),
  ('Bridges Fund Management'),
  ('British Business Bank / British Patient Capital'),
  ('Environmental Technologies Fund (ETF Partners)'),
  ('Just Climate'),
  ('SDCL (Sustainable Development Capital)'),
  ('UK Infrastructure Bank'),
  ('Zouk Capital'),
  ('Actis'),
  ('Astanor Ventures'),
  ('Atomico'),
  ('Balderton Capital'),
  ('Big Society Capital'),
  ('Breakthrough Energy Ventures Europe'),
  ('Circularity Capital'),
  ('Contrarian Ventures'),
  ('Hydra Ventures (Anglian Water Group)'),
  ('Katapult Ocean'),
  ('Lakestar'),
  ('Legal & General Capital'),
  ('Molten Ventures'),
  ('Northzone'),
  ('Pale Blue Dot Capital'),
  ('Par Equity'),
  ('Planet First Partners'),
  ('Rebalance Earth'),
  ('SET Ventures'),
  ('SWEN Capital Partners (Blue Ocean strategy)'),
  ('Scottish Water Horizons'),
  ('Thames Water Innovation'),
  ('XPV Water Partners')
),
target_org AS (
  SELECT id FROM public.organisations WHERE name = 'FUST Lab'
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
  'Approved FUST Lab target supplied by LVCN management.', now(), a.uk_reviewed_by
FROM public.potential_meetings_archive_20260919 a
JOIN target_org o ON o.id = a.organisation_id
JOIN requested r ON lower(r.institution_name) = lower(a.institution_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.potential_meetings pm
  WHERE pm.organisation_id = a.organisation_id
    AND lower(pm.institution_name) = lower(a.institution_name)
);

WITH requested(institution_name) AS (
  VALUES
  ('PiLabs'),
  ('Claire Trant (Untap Health)'),
  ('Zero Carbon Capital'),
  ('Systemiq Capital'),
  ('Clean Growth Fund'),
  ('Kiko Ventures'),
  ('Severn Trent'),
  ('Yorkshire Water'),
  ('Thames Water'),
  ('Environmental law specialist (TBD firm)'),
  ('Innovate UK'),
  ('Anglian Water'),
  ('United Utilities'),
  ('Northumbrian Water'),
  ('Scottish Water'),
  ('UKWIR (UK Water Industry Research)'),
  ('Environment Agency'),
  ('Ofwat Innovation Fund'),
  ('Voyager Ventures'),
  ('PureTerra Ventures (specialist water VC)'),
  ('Natural Ventures (water-security fund)'),
  ('Emerald Technology Ventures'),
  ('Analytic'),
  ('Breakthrough Energy Ventures'),
  ('2150'),
  ('Climate VC'),
  ('Sustainable Ventures'),
  ('Elbow Beach Capital'),
  ('OnePlanetCapital'),
  ('Octopus Ventures'),
  ('Parkwalk Advisors'),
  ('IQ Capital'),
  ('Amadeus Capital Partners'),
  ('BGF Early Stage'),
  ('Cambridge Innovation Capital'),
  ('Longwall Ventures'),
  ('Northern Gritstone'),
  ('Ahren Innovation Capital'),
  ('Eclipse'),
  ('Lowercarbon Capital'),
  ('Congruent Ventures'),
  ('Energy Impact Partners'),
  ('World Fund'),
  ('Norrsken VC'),
  ('AENU'),
  ('Extantia'),
  ('Planet A Ventures'),
  ('Blue Bear Capital'),
  ('Shell Ventures'),
  ('BP Ventures'),
  ('Equinor Ventures'),
  ('National Grid Partners'),
  ('ENGIE New Ventures'),
  ('Veolia Ventures'),
  ('SUEZ Ventures'),
  ('Xylem Innovation Labs'),
  ('Thames Water Ventures'),
  ('Severn Trent Ventures'),
  ('Anglian Water Innovation'),
  ('Yorkshire Water Innovation'),
  ('M&G Catalyst'),
  ('British Growth Partnership'),
  ('Schroders Capital'),
  ('Future Fund: Breakthrough'),
  ('NATO Innovation Fund'),
  ('Playground Global'),
  ('DCVC'),
  ('Lux Capital'),
  ('Atlantic Bridge'),
  ('AlbionVC'),
  ('Foresight Group'),
  ('Bridges Fund Management'),
  ('British Business Bank / British Patient Capital'),
  ('Environmental Technologies Fund (ETF Partners)'),
  ('Just Climate'),
  ('SDCL (Sustainable Development Capital)'),
  ('UK Infrastructure Bank'),
  ('Zouk Capital'),
  ('Actis'),
  ('Astanor Ventures'),
  ('Atomico'),
  ('Balderton Capital'),
  ('Big Society Capital'),
  ('Breakthrough Energy Ventures Europe'),
  ('Circularity Capital'),
  ('Contrarian Ventures'),
  ('Hydra Ventures (Anglian Water Group)'),
  ('Katapult Ocean'),
  ('Lakestar'),
  ('Legal & General Capital'),
  ('Molten Ventures'),
  ('Northzone'),
  ('Pale Blue Dot Capital'),
  ('Par Equity'),
  ('Planet First Partners'),
  ('Rebalance Earth'),
  ('SET Ventures'),
  ('SWEN Capital Partners (Blue Ocean strategy)'),
  ('Scottish Water Horizons'),
  ('Thames Water Innovation'),
  ('XPV Water Partners')
),
target_org AS (
  SELECT id FROM public.organisations WHERE name = 'FUST Lab'
),
creator AS (
  SELECT created_by FROM public.potential_meetings pm JOIN target_org o ON o.id = pm.organisation_id LIMIT 1
)
INSERT INTO public.potential_meetings (
  organisation_id, institution_name, category, status, startup_visible_note,
  next_action, created_by, uk_relevance_status
)
SELECT
  o.id,
  r.institution_name,
  CASE
    WHEN r.institution_name ~* '(water|utility|environment agency|ofwat|ukwir|xylem|veolia|suez|national grid|engie|shell|bp|equinor)' THEN 'Water / environmental strategic partner'
    WHEN r.institution_name ~* '(law|innovate uk|catapult|analytic)' THEN 'Regulatory / innovation ecosystem'
    ELSE 'Climate / water investor'
  END,
  'draft',
  'LVCN-approved potential relationship for FUST Lab, relevant to PFAS destruction, water-treatment pilots, environmental market entry, or climate-tech funding.',
  'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.',
  c.created_by,
  'pending_review'
FROM requested r
CROSS JOIN target_org o
CROSS JOIN creator c
WHERE NOT EXISTS (
  SELECT 1 FROM public.potential_meetings pm
  WHERE pm.organisation_id = o.id
    AND lower(pm.institution_name) = lower(r.institution_name)
);

UPDATE public.potential_meetings pm
SET
  status = 'draft',
  uk_review_note = 'Approved FUST Lab target supplied by LVCN management.',
  uk_reviewed_at = now(),
  next_action = 'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.'
FROM public.organisations o
WHERE pm.organisation_id = o.id
  AND o.name = 'FUST Lab';

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id, contact_name, internal_note)
SELECT pm.id, 'Hugo', 'PiLabs contact supplied by LVCN management.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'FUST Lab' AND pm.institution_name = 'PiLabs'
ON CONFLICT (potential_meeting_id) DO UPDATE SET contact_name = excluded.contact_name, internal_note = excluded.internal_note, updated_at = now();

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id, contact_name, internal_note)
SELECT pm.id, 'Claire Trant', 'Untap Health contact supplied by LVCN management.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'FUST Lab' AND pm.institution_name = 'Claire Trant (Untap Health)'
ON CONFLICT (potential_meeting_id) DO UPDATE SET contact_name = excluded.contact_name, internal_note = excluded.internal_note, updated_at = now();

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id, contact_name, internal_note)
SELECT pm.id, 'Prof. Ana Soares', 'British Water / Ofwat Innovation Fund contact supplied by LVCN management; multiple relevant projects awarded.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'FUST Lab' AND pm.institution_name = 'British Water / Ofwat Innovation Fund - FUST Lab introduction'
ON CONFLICT (potential_meeting_id) DO UPDATE SET contact_name = excluded.contact_name, internal_note = excluded.internal_note, updated_at = now();

COMMIT;
