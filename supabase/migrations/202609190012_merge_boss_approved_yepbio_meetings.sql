-- LVCN management-approved Parkinson's, research, pharma and life-sciences targets for YepBio.
-- These remain visible to YepBio for the startup's 1-3 priority rating.

BEGIN;

CREATE TEMP TABLE boss_yepbio_targets (institution_name text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO boss_yepbio_targets (institution_name) VALUES
  ('Parkinson''s Research Institute Affiliation'), ('neuro VC'), ('RYSE Asset Management'),
  ('re.Mind Capital'), ('Cure Parkinson''s Foundation-adjacent researchers'), ('NHS ICB(s)'),
  ('SV Health Investors'), ('Advent Life Sciences'), ('Epidarex Capital (Edinburgh)'),
  ('Syncona'), ('Cambridge Innovation Capital'), ('LifeArc'), ('Parkinson''s UK'),
  ('UK Dementia Research Institute'), ('UCL Queen Square Institute of Neurology'),
  ('King''s College London (IoPPN)'), ('Medical Research Council (MRC)'),
  ('Oxford Tech Transfer'), ('4BIO Capital'), ('Epidarex Capital'), ('Parkwalk Advisors'),
  ('Oxford Science Enterprises'), ('Longwall Ventures'), ('LifeArc Ventures'),
  ('Sofinnova Partners'), ('Forbion'), ('HealthCap'), ('EQT Life Sciences'),
  ('Novo Holdings'), ('Kurma Partners'), ('Ysios Capital'), ('M Ventures'),
  ('Novartis Venture Fund'), ('Roche Venture Fund'), ('Pfizer Ventures'),
  ('Sanofi Ventures'), ('UCB Ventures'), ('Boehringer Ingelheim Venture Fund'),
  ('Johnson & Johnson Innovation'), ('AbbVie Ventures'), ('Amgen Ventures'),
  ('Takeda Ventures'), ('Eli Lilly Ventures'), ('Biogen Ventures'), ('Merck Ventures'),
  ('OrbiMed'), ('RA Capital'), ('F-Prime Capital'), ('Deerfield'),
  ('Samsara BioCapital'), ('MPM Capital'), ('Third Rock Ventures'), ('Atlas Venture'),
  ('Omega Funds'), ('Venrock'), ('ARCH Venture Partners'), ('Sofinnova MD Start'),
  ('BGF Early Stage'), ('British Patient Capital'), ('Future Fund: Breakthrough'),
  ('Schroders Capital'), ('M&G Catalyst'), ('IP Group'), ('Northern Gritstone'),
  ('Abingworth'), ('Medicxi'), ('SR One Capital Management'),
  ('UK Innovation & Science Seed Fund (UKI2S)'), ('Aescap Venture'),
  ('Amadeus Capital Partners'), ('Andera Partners'), ('Apeiron Investment Group'),
  ('BioGeneration Ventures'), ('Biogen (corporate strategic investment)'),
  ('Calculus Capital'), ('Gilde Healthcare'), ('Kreos Capital'),
  ('LSP (Life Sciences Partners)'), ('Lilly Ventures / Lilly Asia Ventures'),
  ('Mercia Asset Management'), ('Molten Ventures'), ('Oxford Sciences Innovation'),
  ('Perceptive Advisors'), ('Pureos Bioventures'), ('RTW Investments'),
  ('Scottish Investment Bank / Scottish Enterprise'), ('Seroba Life Sciences'),
  ('Talis Capital'), ('Wellington Partners');

WITH target_org AS (SELECT id FROM public.organisations WHERE name = 'YepBio')
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
  a.uk_fit_rationale, 'Approved YepBio target supplied by LVCN management.', now(), a.uk_reviewed_by
FROM public.potential_meetings_archive_20260919 a
JOIN target_org o ON o.id = a.organisation_id
JOIN boss_yepbio_targets t ON lower(t.institution_name) = lower(a.institution_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.potential_meetings pm
  WHERE pm.organisation_id = a.organisation_id AND lower(pm.institution_name) = lower(a.institution_name)
);

WITH target_org AS (SELECT id FROM public.organisations WHERE name = 'YepBio'),
creator AS (
  SELECT pm.created_by FROM public.potential_meetings pm JOIN target_org o ON o.id = pm.organisation_id LIMIT 1
)
INSERT INTO public.potential_meetings (
  organisation_id, institution_name, category, status, startup_visible_note,
  next_action, created_by, uk_relevance_status
)
SELECT o.id, t.institution_name,
  CASE
    WHEN t.institution_name ~* '(parkinson|researchers|nhs|dementia|queen square|ioppn|medical research council|tech transfer|lifearc)' THEN 'Parkinson''s research / clinical ecosystem'
    WHEN t.institution_name ~* '(novartis|roche|pfizer|sanofi|ucb|boehringer|johnson|abbvie|amgen|takeda|lilly|biogen|merck)' THEN 'Pharma strategic partner'
    ELSE 'Life-sciences investor'
  END,
  'draft',
  'LVCN-approved potential relationship for YepBio, relevant to Parkinson''s disease research, clinical translation, therapeutic partnering, or life-sciences financing.',
  'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.',
  c.created_by, 'pending_review'
FROM boss_yepbio_targets t CROSS JOIN target_org o CROSS JOIN creator c
WHERE NOT EXISTS (
  SELECT 1 FROM public.potential_meetings pm
  WHERE pm.organisation_id = o.id AND lower(pm.institution_name) = lower(t.institution_name)
);

UPDATE public.potential_meetings pm
SET status = 'draft',
    uk_review_note = 'Approved YepBio target supplied by LVCN management.',
    uk_reviewed_at = now(),
    next_action = 'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.'
FROM public.organisations o
WHERE pm.organisation_id = o.id AND o.name = 'YepBio';

UPDATE public.potential_meetings pm
SET category = CASE
    WHEN pm.institution_name ~* '(parkinson|researchers|nhs|dementia|queen square|ioppn|medical research council|tech transfer|lifearc)' THEN 'Parkinson''s research / clinical ecosystem'
    WHEN pm.institution_name ~* '(novartis|roche|pfizer|sanofi|ucb|boehringer|johnson|abbvie|amgen|takeda|lilly|biogen|merck)' THEN 'Pharma strategic partner'
    ELSE pm.category
  END
FROM public.organisations o
WHERE pm.organisation_id = o.id AND o.name = 'YepBio';

COMMIT;
