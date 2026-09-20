-- LVCN management-approved diabetes, digital-health, clinical and funding targets for HME Square.
-- Every target remains visible to HME Square for its 1-3 priority rating.

BEGIN;

CREATE TEMP TABLE boss_hme_targets (institution_name text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO boss_hme_targets (institution_name) VALUES
  ('Esther Richardot (Thena)'), ('DigitalHealth.London'),
  ('Health Innovation Network South London'), ('Boots UK'), ('Forbion'), ('Thuja'),
  ('Octopus'), ('Hoxton'), ('Sofinnova Crossover'), ('Calm/Storm'), ('LIHE / KCL'),
  ('SV Health Investors'), ('Air Street Capital'), ('Well Pharmacy'), ('Livi (UK)'),
  ('Diabetes UK'), ('JDRF UK (Breakthrough T1D)'),
  ('Guy''s and St Thomas'' Diabetes Centre'), ('NICE'), ('Octopus Ventures'),
  ('AlbionVC'), ('Beringea'), ('Parkwalk Advisors'), ('Molten Ventures'),
  ('Balderton Capital'), ('Atomico'), ('Hoxton Ventures'), ('Playfair Capital'),
  ('MMC Ventures'), ('Ada Ventures'), ('Sofinnova Partners'), ('Gilde Healthcare'),
  ('Apposite Capital'), ('Epidarex Capital'), ('EQT Life Sciences'), ('BGF'),
  ('M&G Catalyst'), ('Highland Europe'), ('Dawn Capital'), ('Notion Capital'),
  ('Northzone'), ('EQT Ventures'), ('General Catalyst'), ('GV'),
  ('SoftBank Investment Advisers'), ('Schroders Capital'), ('British Patient Capital'),
  ('Future Fund: Breakthrough'), ('Maven Capital Partners'), ('Mercia Ventures'),
  ('Foresight Group'), ('Downing Ventures'), ('Oxford Science Enterprises'),
  ('Cambridge Innovation Capital'), ('IP Group'), ('Northern Gritstone'),
  ('EIS/Knowledge Intensive funds'), ('LocalGlobe'), ('Seedcamp'), ('Antler'),
  ('Entrepreneur First'), ('Kindred Capital'), ('SuperSeed'), ('Crane Venture Partners'),
  ('Frontline Ventures'), ('4BIO Capital'), ('Abingworth'), ('Advent Life Sciences'),
  ('Amadeus Capital Partners'), ('British Business Bank'), ('Eight Roads Ventures'),
  ('GHO Capital Partners'), ('General Atlantic'), ('Index Ventures'),
  ('Johnson & Johnson Innovation (JJDC)'), ('Medicxi'), ('Mercia Asset Management'),
  ('Novo Holdings'), ('Oxford Capital'), ('Oxford Sciences Enterprises'),
  ('Qualcomm Ventures'), ('Sanofi Ventures'), ('Syncona'),
  ('UK Innovation & Science Seed Fund (UKI2S)'), ('AXA Venture Partners'), ('Accel'),
  ('Bethnal Green Ventures'), ('Bupa (corporate innovation/ventures)'),
  ('Development Bank of Wales'), ('Intel Capital'), ('LG Technology Ventures'),
  ('Legal & General Capital'), ('Northern Powerhouse Investment Fund II'),
  ('Reuben Brothers'), ('Samsung Catalyst Fund'),
  ('Scottish Enterprise / Scottish Investment Bank'), ('Sony Innovation Fund'),
  ('TA Associates'), ('Talis Capital'), ('Warburg Pincus');

WITH target_org AS (SELECT id FROM public.organisations WHERE name = 'HME Square')
INSERT INTO public.potential_meetings (
  id, organisation_id, institution_name, category, status,
  proposed_starts_at, proposed_ends_at, location, external_url,
  startup_visible_note, next_action, owner_profile_id, created_by,
  created_at, updated_at, legacy_schedule_item_id,
  uk_relevance_status, uk_presence_type, uk_presence_location,
  uk_evidence_url, uk_fit_rationale, uk_review_note, uk_reviewed_at, uk_reviewed_by
)
SELECT a.id, a.organisation_id, a.institution_name, a.category, 'draft',
  a.proposed_starts_at, a.proposed_ends_at, a.location, a.external_url,
  a.startup_visible_note,
  'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.',
  a.owner_profile_id, a.created_by, a.created_at, now(), a.legacy_schedule_item_id,
  'pending_review', a.uk_presence_type, a.uk_presence_location, a.uk_evidence_url,
  a.uk_fit_rationale, 'Approved HME Square target supplied by LVCN management.', now(), a.uk_reviewed_by
FROM public.potential_meetings_archive_20260919 a
JOIN target_org o ON o.id = a.organisation_id
JOIN boss_hme_targets t ON lower(t.institution_name) = lower(a.institution_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.potential_meetings pm
  WHERE pm.organisation_id = a.organisation_id AND lower(pm.institution_name) = lower(a.institution_name)
);

WITH target_org AS (SELECT id FROM public.organisations WHERE name = 'HME Square'),
creator AS (
  SELECT pm.created_by FROM public.potential_meetings pm JOIN target_org o ON o.id = pm.organisation_id LIMIT 1
)
INSERT INTO public.potential_meetings (
  organisation_id, institution_name, category, status, startup_visible_note,
  next_action, created_by, uk_relevance_status
)
SELECT o.id, t.institution_name,
  CASE
    WHEN t.institution_name ~* '(digitalhealth|health innovation|boots|pharmacy|livi|diabetes uk|jdrf|guy|nice|lihe|kcl|thena)' THEN 'Clinical / NHS / health-market partner'
    WHEN t.institution_name ~* '(bupa|johnson|sanofi|qualcomm|intel|lg|samsung|sony)' THEN 'Health-tech strategic partner'
    ELSE 'Health-tech / life-sciences investor'
  END,
  'draft',
  'LVCN-approved potential relationship for HME Square, relevant to diabetes research, clinical validation or trials, NHS and health-market access, pharmacy distribution, or health-tech funding.',
  'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.',
  c.created_by, 'pending_review'
FROM boss_hme_targets t CROSS JOIN target_org o CROSS JOIN creator c
WHERE NOT EXISTS (
  SELECT 1 FROM public.potential_meetings pm
  WHERE pm.organisation_id = o.id AND lower(pm.institution_name) = lower(t.institution_name)
);

UPDATE public.potential_meetings pm
SET status = 'draft',
    uk_review_note = 'Approved HME Square target supplied by LVCN management.',
    uk_reviewed_at = now(),
    next_action = 'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.'
FROM public.organisations o
WHERE pm.organisation_id = o.id AND o.name = 'HME Square';

UPDATE public.potential_meetings pm
SET category = CASE
    WHEN pm.institution_name ~* '(digitalhealth|health innovation|boots|pharmacy|livi|diabetes uk|jdrf|guy|nice|lihe|kcl|thena)' THEN 'Clinical / NHS / health-market partner'
    WHEN pm.institution_name ~* '(bupa|johnson|sanofi|qualcomm|intel|lg|samsung|sony)' THEN 'Health-tech strategic partner'
    ELSE pm.category
  END
FROM public.organisations o
WHERE pm.organisation_id = o.id AND o.name = 'HME Square';

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id, contact_name, internal_note)
SELECT pm.id, 'Procurement Manager (TBD)', 'Seek the appropriate Boots UK procurement manager for an introduction; contact requirement supplied by LVCN management.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'HME Square' AND pm.institution_name = 'Boots UK'
ON CONFLICT (potential_meeting_id) DO UPDATE SET contact_name = excluded.contact_name, internal_note = excluded.internal_note, updated_at = now();

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id, contact_name, internal_note)
SELECT pm.id, 'Esther Richardot', 'Thena contact supplied by LVCN management.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'HME Square' AND pm.institution_name = 'Esther Richardot (Thena)'
ON CONFLICT (potential_meeting_id) DO UPDATE SET contact_name = excluded.contact_name, internal_note = excluded.internal_note, updated_at = now();

COMMIT;
