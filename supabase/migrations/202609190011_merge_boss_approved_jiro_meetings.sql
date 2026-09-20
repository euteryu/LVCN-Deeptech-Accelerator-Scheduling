-- LVCN management-approved agency, media, brand and funding targets for Jiro / Dropshot AI.
-- Every row remains visible to the startup for its 1-3 priority rating.

BEGIN;

WITH requested(institution_name) AS (
  VALUES
  ('Fieldhouse Associates'), ('WPP (UK office)'), ('Publicis (UK office)'),
  ('Havas (UK office)'), ('Brandtech Group'), ('Ogilvy UK'), ('M&C Saatchi'),
  ('dentsu UK'), ('IPG Mediabrands UK'), ('Creative UK'), ('LocalGlobe / Latitude'),
  ('Hoxton Ventures'), ('Ada Ventures'), ('Balderton Capital'), ('Atomico'),
  ('Molten Ventures'), ('Highland Europe'), ('Octopus Ventures'), ('Notion Capital'),
  ('Dawn Capital'), ('Episode 1 Ventures'), ('Playfair Capital'), ('MMC Ventures'),
  ('Crane Venture Partners'), ('SuperSeed'), ('Frontline Ventures'), ('Northzone'),
  ('EQT Ventures'), ('Lakestar'), ('General Catalyst'), ('GV'), ('Prosus Ventures'),
  ('Felicis'), ('Index Ventures'), ('Accel'), ('Lightspeed Venture Partners'),
  ('Andreessen Horowitz'), ('WPP Ventures'), ('Publicis Ventures'), ('S4 Capital'),
  ('Omnicom Ventures'), ('Havas Ventures'), ('Bertelsmann Investments'),
  ('Sky Ventures'), ('ITV Ventures'), ('Warner Bros. Discovery Ventures'),
  ('Comcast Ventures'), ('Adobe Ventures'), ('NVIDIA NVentures'), ('Google Ventures'),
  ('Microsoft M12'), ('Salesforce Ventures'), ('HubSpot Ventures'),
  ('British Growth Partnership'), ('M&G Catalyst'), ('Schroders Capital'),
  ('SoftBank Investment Advisers'), ('LocalGlobe'), ('Seedcamp'), ('Kindred Capital'),
  ('Entrepreneur First'), ('Antler'), ('Amadeus Capital Partners'),
  ('British Patient Capital / British Business Bank'), ('Felix Capital'), ('Frog Capital'),
  ('Insight Partners'), ('Unilever Ventures'), ('Ahren Innovation Capital'), ('Beringea'),
  ('Blossom Capital'), ('Dentsu Ventures'), ('Eight Roads Ventures'),
  ('Forward Partners'), ('Google Gradient Ventures'),
  ('Guardian Media Group Ventures (GMG Ventures)'), ('Hambro Perks'),
  ('JamJar Investments'), ('L''Oreal BOLD'), ('Left Lane Capital'),
  ('Mercia Asset Management'), ('Northern Powerhouse Investment Fund'),
  ('Oxford Capital'), ('Par Equity'), ('Piton Capital'),
  ('Puma Private Equity (Puma Investments)'), ('Scottish National Investment Bank'),
  -- Additional UK-based operators with verified, relevant generative-AI adoption.
  ('ITV Commercial'), ('Virgin Media O2')
),
target_org AS (
  SELECT id FROM public.organisations WHERE name = 'Jiro Inc. (Dropshot AI)'
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
  a.startup_visible_note,
  'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.',
  a.owner_profile_id, a.created_by, a.created_at, now(), a.legacy_schedule_item_id,
  'pending_review', a.uk_presence_type, a.uk_presence_location,
  a.uk_evidence_url, a.uk_fit_rationale,
  'Approved Jiro / Dropshot AI target supplied by LVCN management.', now(), a.uk_reviewed_by
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
  ('Fieldhouse Associates'), ('WPP (UK office)'), ('Publicis (UK office)'),
  ('Havas (UK office)'), ('Brandtech Group'), ('Ogilvy UK'), ('M&C Saatchi'),
  ('dentsu UK'), ('IPG Mediabrands UK'), ('Creative UK'), ('LocalGlobe / Latitude'),
  ('Hoxton Ventures'), ('Ada Ventures'), ('Balderton Capital'), ('Atomico'),
  ('Molten Ventures'), ('Highland Europe'), ('Octopus Ventures'), ('Notion Capital'),
  ('Dawn Capital'), ('Episode 1 Ventures'), ('Playfair Capital'), ('MMC Ventures'),
  ('Crane Venture Partners'), ('SuperSeed'), ('Frontline Ventures'), ('Northzone'),
  ('EQT Ventures'), ('Lakestar'), ('General Catalyst'), ('GV'), ('Prosus Ventures'),
  ('Felicis'), ('Index Ventures'), ('Accel'), ('Lightspeed Venture Partners'),
  ('Andreessen Horowitz'), ('WPP Ventures'), ('Publicis Ventures'), ('S4 Capital'),
  ('Omnicom Ventures'), ('Havas Ventures'), ('Bertelsmann Investments'),
  ('Sky Ventures'), ('ITV Ventures'), ('Warner Bros. Discovery Ventures'),
  ('Comcast Ventures'), ('Adobe Ventures'), ('NVIDIA NVentures'), ('Google Ventures'),
  ('Microsoft M12'), ('Salesforce Ventures'), ('HubSpot Ventures'),
  ('British Growth Partnership'), ('M&G Catalyst'), ('Schroders Capital'),
  ('SoftBank Investment Advisers'), ('LocalGlobe'), ('Seedcamp'), ('Kindred Capital'),
  ('Entrepreneur First'), ('Antler'), ('Amadeus Capital Partners'),
  ('British Patient Capital / British Business Bank'), ('Felix Capital'), ('Frog Capital'),
  ('Insight Partners'), ('Unilever Ventures'), ('Ahren Innovation Capital'), ('Beringea'),
  ('Blossom Capital'), ('Dentsu Ventures'), ('Eight Roads Ventures'),
  ('Forward Partners'), ('Google Gradient Ventures'),
  ('Guardian Media Group Ventures (GMG Ventures)'), ('Hambro Perks'),
  ('JamJar Investments'), ('L''Oreal BOLD'), ('Left Lane Capital'),
  ('Mercia Asset Management'), ('Northern Powerhouse Investment Fund'),
  ('Oxford Capital'), ('Par Equity'), ('Piton Capital'),
  ('Puma Private Equity (Puma Investments)'), ('Scottish National Investment Bank'),
  ('ITV Commercial'), ('Virgin Media O2')
),
target_org AS (
  SELECT id FROM public.organisations WHERE name = 'Jiro Inc. (Dropshot AI)'
),
creator AS (
  SELECT pm.created_by FROM public.potential_meetings pm
  JOIN target_org o ON o.id = pm.organisation_id LIMIT 1
)
INSERT INTO public.potential_meetings (
  organisation_id, institution_name, category, status, startup_visible_note,
  next_action, created_by, uk_relevance_status
)
SELECT
  o.id, r.institution_name,
  CASE WHEN r.institution_name ~* '(fieldhouse|wpp|publicis|havas|brandtech|ogilvy|saatchi|dentsu|ipg|creative|s4|omnicom|sky|itv|warner|comcast|adobe|unilever|o2|virgin)' THEN
    'Brand / agency / media operator'
  ELSE 'Investor / strategic finance' END,
  'draft',
  'LVCN-approved potential relationship for Jiro / Dropshot AI, relevant to UK agency, brand, media, rights-cleared generative-video adoption, compliance, or growth funding.',
  'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.',
  c.created_by, 'pending_review'
FROM requested r CROSS JOIN target_org o CROSS JOIN creator c
WHERE NOT EXISTS (
  SELECT 1 FROM public.potential_meetings pm
  WHERE pm.organisation_id = o.id AND lower(pm.institution_name) = lower(r.institution_name)
);

UPDATE public.potential_meetings pm
SET status = 'draft',
    uk_review_note = 'Approved Jiro / Dropshot AI target supplied by LVCN management.',
    uk_reviewed_at = now(),
    next_action = 'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.'
FROM public.organisations o
WHERE pm.organisation_id = o.id AND o.name = 'Jiro Inc. (Dropshot AI)';

-- Keep the startup-facing grouping meaningful: these are prospective commercial
-- operators, agencies or media partners, rather than funding conversations.
UPDATE public.potential_meetings pm
SET category = 'Brand / agency / media operator'
FROM public.organisations o
WHERE pm.organisation_id = o.id
  AND o.name = 'Jiro Inc. (Dropshot AI)'
  AND pm.institution_name ~* '(fieldhouse|wpp|publicis|havas|brandtech|ogilvy|saatchi|dentsu|ipg|creative|s4|omnicom|sky|itv|warner|comcast|adobe|unilever|o2|virgin)';

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id, internal_note)
SELECT pm.id, 'UK commercial broadcaster. ITV has publicly launched a licensed GenAI ad-production service for SME advertisers; relevant operator for Jiro''s rights-cleared generative-video proposition.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'Jiro Inc. (Dropshot AI)' AND pm.institution_name = 'ITV Commercial'
ON CONFLICT (potential_meeting_id) DO UPDATE SET internal_note = excluded.internal_note, updated_at = now();

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id, internal_note)
SELECT pm.id, 'UK telecom and media operator. Virgin Media O2 / O2 has run a public GenAI campaign, making it a relevant prospective brand/operator conversation for Jiro.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'Jiro Inc. (Dropshot AI)' AND pm.institution_name = 'Virgin Media O2'
ON CONFLICT (potential_meeting_id) DO UPDATE SET internal_note = excluded.internal_note, updated_at = now();

COMMIT;
