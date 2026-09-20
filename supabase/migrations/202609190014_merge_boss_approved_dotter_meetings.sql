-- LVCN management-approved medtech, clinical, procurement and investment targets for Dotter.
-- Contact details remain admin-only; targets remain visible to Dotter for 1-3 rating.

BEGIN;

CREATE TEMP TABLE boss_dotter_targets (
  institution_name text PRIMARY KEY,
  required_status text NOT NULL DEFAULT 'draft'
) ON COMMIT DROP;

INSERT INTO boss_dotter_targets (institution_name, required_status) VALUES
  ('MedTech Investor (Private Equity?)', 'draft'),
  ('NHS London Procurement Partnership', 'draft'),
  ('Department for Business and Trade', 'draft'), ('LIHE / KCL', 'contacted'),
  ('Innovate UK', 'contacted'), ('SV Health Investors', 'draft'),
  ('Advent Life Sciences', 'contacted'), ('Medicxi', 'draft'), ('BGF', 'draft'),
  ('Cambridge Innovation Capital', 'draft'), ('IP Group', 'draft'),
  ('Sofinnova Partners', 'draft'), ('British Heart Foundation', 'contacted'),
  ('NICE (National Institute for Health and Care Excellence)', 'contacted'),
  ('MedCity', 'contacted'), ('Barts Heart Centre (Barts Health NHS Trust)', 'draft'),
  ('Royal Brompton Hospital', 'contacted'), ('Golden Jubilee National Hospital', 'contacted'),
  ('ProPharma', 'agreed'), ('NAMSA', 'agreed'), ('EQT Life Sciences', 'draft'),
  ('Gilde Healthcare', 'draft'), ('HealthCap', 'draft'), ('Apposite Capital', 'draft'),
  ('Epidarex Capital', 'draft'), ('Parkwalk Advisors', 'draft'),
  ('Octopus Ventures', 'draft'), ('BGF Early Stage', 'draft'), ('Syncona', 'draft'),
  ('4BIO Capital', 'draft'), ('Forbion', 'draft'), ('LifeArc Ventures', 'draft'),
  ('Sofinnova MD Start', 'draft'), ('Kurma Partners', 'draft'),
  ('MedTech Convergence Fund', 'draft'), ('Ysios Capital', 'draft'),
  ('Novo Holdings', 'draft'), ('M Ventures', 'draft'),
  ('Johnson & Johnson Innovation', 'draft'), ('Medtronic Ventures', 'draft'),
  ('GE HealthCare Ventures', 'draft'), ('Philips Ventures', 'draft'),
  ('Siemens Healthineers Ventures', 'draft'), ('Boston Scientific Ventures', 'draft'),
  ('Abbott Ventures', 'draft'), ('Stryker Ventures', 'draft'),
  ('Roche Venture Fund', 'draft'), ('UCB Ventures', 'draft'),
  ('Samsara BioCapital', 'draft'), ('F-Prime Capital', 'draft'), ('RA Capital', 'draft'),
  ('OrbiMed', 'draft'), ('Deerfield', 'draft'), ('Cowen Healthcare Investments', 'draft'),
  ('Vesalius Biocapital', 'draft'), ('Wellington Partners', 'draft'),
  ('LSP (Life Sciences Partners)', 'draft'), ('Molten Ventures', 'draft'),
  ('AlbionVC', 'draft'), ('Nautilus Venture Partners', 'draft'),
  ('Oxford Science Enterprises', 'draft'), ('Longwall Ventures', 'draft'),
  ('British Patient Capital', 'draft'), ('Schroders Capital', 'draft'),
  ('Abingworth', 'draft'), ('Amadeus Capital Partners', 'draft'), ('Apax Partners', 'draft'),
  ('General Atlantic', 'draft'), ('Warburg Pincus', 'draft'), ('Wellcome Trust', 'draft'),
  ('Ahren Innovation Capital', 'draft'), ('Andera Partners (formerly EdRIP)', 'draft'),
  ('Baillie Gifford', 'draft'), ('BioMed Partners', 'draft'), ('Bridgepoint', 'draft'),
  ('Cinven', 'draft'), ('EQT', 'draft'), ('Fresenius Medical Care Ventures', 'draft'),
  ('GIC', 'draft'), ('KKR Health Care Strategic Growth Fund', 'draft'),
  ('Kreos Capital', 'draft'), ('Mercia Asset Management', 'draft'),
  ('Mubadala Capital', 'draft'), ('Next47 (Siemens)', 'draft'),
  ('Northern Gritstone', 'draft'), ('Panakes Partners', 'draft'),
  ('Qatar Investment Authority', 'draft'), ('Seventure Partners', 'draft'),
  ('Temasek', 'draft'), ('Terumo Ventures', 'draft'), ('Vitruvian Partners', 'draft')
ON CONFLICT (institution_name) DO UPDATE
  SET required_status = CASE
    WHEN EXCLUDED.required_status = 'agreed' THEN 'agreed'
    WHEN EXCLUDED.required_status = 'contacted' AND boss_dotter_targets.required_status = 'draft' THEN 'contacted'
    ELSE boss_dotter_targets.required_status
  END;

WITH target_org AS (SELECT id FROM public.organisations WHERE name = 'Dotter')
INSERT INTO public.potential_meetings (
  id, organisation_id, institution_name, category, status,
  proposed_starts_at, proposed_ends_at, location, external_url,
  startup_visible_note, next_action, owner_profile_id, created_by,
  created_at, updated_at, legacy_schedule_item_id,
  uk_relevance_status, uk_presence_type, uk_presence_location,
  uk_evidence_url, uk_fit_rationale, uk_review_note, uk_reviewed_at, uk_reviewed_by
)
SELECT a.id, a.organisation_id, a.institution_name, a.category, t.required_status::public.potential_meeting_status,
  a.proposed_starts_at, a.proposed_ends_at, a.location, a.external_url,
  a.startup_visible_note,
  'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.',
  a.owner_profile_id, a.created_by, a.created_at, now(), a.legacy_schedule_item_id,
  'pending_review', a.uk_presence_type, a.uk_presence_location, a.uk_evidence_url,
  a.uk_fit_rationale, 'Approved Dotter target supplied by LVCN management.', now(), a.uk_reviewed_by
FROM public.potential_meetings_archive_20260919 a
JOIN target_org o ON o.id = a.organisation_id
JOIN boss_dotter_targets t ON lower(t.institution_name) = lower(a.institution_name)
WHERE NOT EXISTS (SELECT 1 FROM public.potential_meetings pm WHERE pm.organisation_id = a.organisation_id AND lower(pm.institution_name) = lower(a.institution_name));

WITH target_org AS (SELECT id FROM public.organisations WHERE name = 'Dotter'),
creator AS (SELECT pm.created_by FROM public.potential_meetings pm JOIN target_org o ON o.id = pm.organisation_id LIMIT 1)
INSERT INTO public.potential_meetings (organisation_id, institution_name, category, status, startup_visible_note, next_action, created_by, uk_relevance_status)
SELECT o.id, t.institution_name,
  CASE
    WHEN t.institution_name ~* '(nhs|hospital|heart foundation|nice|medcity|lihe|kcl|procurement|business and trade|innovate uk)' THEN 'Clinical / NHS / market-access partner'
    WHEN t.institution_name ~* '(propharma|namsa)' THEN 'Medtech regulatory / clinical partner'
    WHEN t.institution_name ~* '(medtronic|ge healthcare|philips|siemens|boston scientific|abbott|stryker|roche|johnson|ucb|fresenius|terumo)' THEN 'Medtech strategic partner'
    ELSE 'Medtech / life-sciences investor'
  END,
  t.required_status::public.potential_meeting_status,
  'LVCN-approved potential relationship for Dotter, relevant to coronary-device clinical validation, NHS procurement, regulatory pathway, distribution, strategic partnering, or medtech funding.',
  'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.',
  c.created_by, 'pending_review'
FROM boss_dotter_targets t CROSS JOIN target_org o CROSS JOIN creator c
WHERE NOT EXISTS (SELECT 1 FROM public.potential_meetings pm WHERE pm.organisation_id = o.id AND lower(pm.institution_name) = lower(t.institution_name));

UPDATE public.potential_meetings pm
SET status = t.required_status::public.potential_meeting_status,
    uk_review_note = 'Approved Dotter target supplied by LVCN management.',
    uk_reviewed_at = now(),
    next_action = CASE WHEN t.required_status = 'agreed' THEN 'Coordinate the agreed next step with the institution and Dotter.' WHEN t.required_status = 'contacted' THEN 'Follow up on the sent introduction and capture Dotter''s 1-3 rating.' ELSE 'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.' END
FROM public.organisations o, boss_dotter_targets t
WHERE pm.organisation_id = o.id
  AND o.name = 'Dotter'
  AND lower(t.institution_name) = lower(pm.institution_name);

UPDATE public.potential_meetings pm
SET category = CASE
    WHEN pm.institution_name ~* '(nhs|hospital|heart foundation|nice|medcity|lihe|kcl|procurement|business and trade|innovate uk)' THEN 'Clinical / NHS / market-access partner'
    WHEN pm.institution_name ~* '(propharma|namsa)' THEN 'Medtech regulatory / clinical partner'
    WHEN pm.institution_name ~* '(medtronic|ge healthcare|philips|siemens|boston scientific|abbott|stryker|roche|johnson|ucb|fresenius|terumo)' THEN 'Medtech strategic partner'
    ELSE pm.category END
FROM public.organisations o WHERE pm.organisation_id = o.id AND o.name = 'Dotter';

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id, contact_name, contact_email, internal_note)
SELECT pm.id, 'Lee Joseph', 'lee.joseph4@nhs.net', 'Known contact. Former NHS medical director / NHS London Procurement Partnership. Also known: Anna Hawksley, anna.hawksley1@nhs.net.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'Dotter' AND pm.institution_name = 'NHS London Procurement Partnership'
ON CONFLICT (potential_meeting_id) DO UPDATE SET contact_name = excluded.contact_name, contact_email = excluded.contact_email, internal_note = excluded.internal_note, updated_at = now();

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id, contact_name, contact_email, internal_note)
SELECT pm.id, 'Dace Dimza Jones', 'Dace.DimzaJones@businessandtrade.gov.uk', 'Known contact supplied by LVCN management.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'Dotter' AND pm.institution_name = 'Department for Business and Trade'
ON CONFLICT (potential_meeting_id) DO UPDATE SET contact_name = excluded.contact_name, contact_email = excluded.contact_email, internal_note = excluded.internal_note, updated_at = now();

COMMIT;
