-- LVCN management-approved potential meetings for PA Robotics.
-- Deduplicated aliases: WMG/Warwick, HVM Catapult, and InMotion/JLR CVC.

BEGIN;

WITH requested(institution_name) AS (
  VALUES
  ('In Motion Ventures (JLR CVC)'), ('High Value Manufacturing Catapult'), ('Warwick Manufacturing Group'), ('Innovate UK'), ('Manufacturing Technology Centre (MTC), Coventry'), ('AMRC, Sheffield'), ('Ocado Technology'), ('Siemens UK'), ('ABB UK'), ('Rolls-Royce (advanced manufacturing)'), ('BAE Systems (manufacturing)'), ('Made Smarter'), ('Eaton Aerospace'), ('IQ Capital'), ('Amadeus Capital Partners'), ('Octopus Ventures'), ('BGF Early Stage'), ('Cambridge Innovation Capital'), ('Parkwalk Advisors'), ('ABB Ventures'), ('Siemens Energy Ventures'), ('Mitsubishi Corporation'), ('Bosch Ventures'), ('BMW i Ventures'), ('Toyota Ventures'), ('Hyundai CRADLE'), ('Samsung Ventures'), ('Atlantic Bridge'), ('AlbionVC'), ('Molten Ventures'), ('Balderton Capital'), ('Atomico'), ('Lakestar'), ('Northzone'), ('EQT Ventures'), ('Dawn Capital'), ('Highland Europe'), ('M&G Catalyst'), ('British Patient Capital'), ('Schroders Capital'), ('British Growth Partnership'), ('Prosus Ventures'), ('SoftBank Investment Advisers'), ('General Catalyst'), ('Eclipse'), ('Playground Global'), ('E14 Fund'), ('Longwall Ventures'), ('Northern Gritstone'), ('Ahren Innovation Capital'), ('MMC Ventures'), ('Crane Venture Partners'), ('Entrepreneur First'), ('LocalGlobe'), ('Seedcamp'), ('Hoxton Ventures'), ('Notion Capital'), ('Kindred Capital'), ('Frontline Ventures'), ('Foresight Group'), ('Beringea'), ('BGF'), ('IP Group'), ('Mercia Asset Management'), ('Vitruvian Partners'), ('ABB Technology Ventures'), ('Air Street Capital'), ('BP Ventures'), ('Cusp Capital'), ('Development Bank of Wales'), ('Fly Ventures'), ('Forward Partners'), ('Innovation Industries'), ('Isomer Capital'), ('LDC (Lloyds Development Capital)'), ('Legal & General Capital'), ('LocalGlobe / Latitude'), ('National Security Strategic Investment Fund (NSSIF)'), ('Northern Powerhouse Investment Fund'), ('OTB Ventures'), ('Par Equity'), ('Playfair Capital'), ('Praetura Ventures'), ('Project A Ventures'), ('Robert Bosch Venture Capital (RBVC)'), ('Schneider Electric Ventures / Aster Capital'), ('Scottish National Investment Bank'), ('Siemens (Next47)'), ('Speedinvest'), ('UK Innovation & Science Seed Fund (UKI2S)'), ('Verdane'), ('Stadium Group'), ('CTS (Custom Technical Services)'), ('Jabil'), ('Flex'), ('Celestica'), ('ASM Assembly Systems'), ('Mycronic'), ('Yamaha SMT'), ('Kurtz Ersa'), ('Vitronics Soltec'), ('Rockwell Automation UK'), ('Siemens Digital Industries UK'), ('Mitsubishi Electric UK'), ('Omron UK'), ('RS Group (RS Components)'), ('Farnell')
),
target_org AS (
  SELECT id FROM public.organisations WHERE name = 'PA Robotics (Powerauto Robotics)'
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
  'Approved PA Robotics target supplied by LVCN management.', now(), a.uk_reviewed_by
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
  ('In Motion Ventures (JLR CVC)'), ('High Value Manufacturing Catapult'), ('Warwick Manufacturing Group'), ('Innovate UK'), ('Manufacturing Technology Centre (MTC), Coventry'), ('AMRC, Sheffield'), ('Ocado Technology'), ('Siemens UK'), ('ABB UK'), ('Rolls-Royce (advanced manufacturing)'), ('BAE Systems (manufacturing)'), ('Made Smarter'), ('Eaton Aerospace'), ('IQ Capital'), ('Amadeus Capital Partners'), ('Octopus Ventures'), ('BGF Early Stage'), ('Cambridge Innovation Capital'), ('Parkwalk Advisors'), ('ABB Ventures'), ('Siemens Energy Ventures'), ('Mitsubishi Corporation'), ('Bosch Ventures'), ('BMW i Ventures'), ('Toyota Ventures'), ('Hyundai CRADLE'), ('Samsung Ventures'), ('Atlantic Bridge'), ('AlbionVC'), ('Molten Ventures'), ('Balderton Capital'), ('Atomico'), ('Lakestar'), ('Northzone'), ('EQT Ventures'), ('Dawn Capital'), ('Highland Europe'), ('M&G Catalyst'), ('British Patient Capital'), ('Schroders Capital'), ('British Growth Partnership'), ('Prosus Ventures'), ('SoftBank Investment Advisers'), ('General Catalyst'), ('Eclipse'), ('Playground Global'), ('E14 Fund'), ('Longwall Ventures'), ('Northern Gritstone'), ('Ahren Innovation Capital'), ('MMC Ventures'), ('Crane Venture Partners'), ('Entrepreneur First'), ('LocalGlobe'), ('Seedcamp'), ('Hoxton Ventures'), ('Notion Capital'), ('Kindred Capital'), ('Frontline Ventures'), ('Foresight Group'), ('Beringea'), ('BGF'), ('IP Group'), ('Mercia Asset Management'), ('Vitruvian Partners'), ('ABB Technology Ventures'), ('Air Street Capital'), ('BP Ventures'), ('Cusp Capital'), ('Development Bank of Wales'), ('Fly Ventures'), ('Forward Partners'), ('Innovation Industries'), ('Isomer Capital'), ('LDC (Lloyds Development Capital)'), ('Legal & General Capital'), ('LocalGlobe / Latitude'), ('National Security Strategic Investment Fund (NSSIF)'), ('Northern Powerhouse Investment Fund'), ('OTB Ventures'), ('Par Equity'), ('Playfair Capital'), ('Praetura Ventures'), ('Project A Ventures'), ('Robert Bosch Venture Capital (RBVC)'), ('Schneider Electric Ventures / Aster Capital'), ('Scottish National Investment Bank'), ('Siemens (Next47)'), ('Speedinvest'), ('UK Innovation & Science Seed Fund (UKI2S)'), ('Verdane'), ('Stadium Group'), ('CTS (Custom Technical Services)'), ('Jabil'), ('Flex'), ('Celestica'), ('ASM Assembly Systems'), ('Mycronic'), ('Yamaha SMT'), ('Kurtz Ersa'), ('Vitronics Soltec'), ('Rockwell Automation UK'), ('Siemens Digital Industries UK'), ('Mitsubishi Electric UK'), ('Omron UK'), ('RS Group (RS Components)'), ('Farnell')
),
target_org AS (
  SELECT id FROM public.organisations WHERE name = 'PA Robotics (Powerauto Robotics)'
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
    WHEN r.institution_name ~* '(ventures|capital|fund|invest|bank|ldc|bgf|ip group|mercia|isomer|par equity|verdane|speedinvest|seedcamp|localglobe|antler|entrepreneur)' THEN 'Investor / strategic finance'
    WHEN r.institution_name ~* '(catapult|manufacturing|technology centre|amrc|ocado|siemens|abb|rolls-royce|bae|smarter|aerospace|bosch|bmw|toyota|hyundai|samsung|stadium|cts|jabil|flex|celestica|assembly|mycronic|yamaha|kurtz|vitronics|rockwell|mitsubishi|omron|rs group|farnell)' THEN 'Manufacturing / strategic partner'
    ELSE 'UK ecosystem / strategic partner'
  END,
  'draft',
  'LVCN-approved potential relationship for PA Robotics. Relevant to smart manufacturing, robotics, industrial automation, European pilots, or growth funding.',
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
  uk_review_note = 'Approved PA Robotics target supplied by LVCN management.',
  uk_reviewed_at = now(),
  next_action = 'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.'
FROM public.organisations o
WHERE pm.organisation_id = o.id
  AND o.name = 'PA Robotics (Powerauto Robotics)';

INSERT INTO public.potential_meeting_admin_details (
  potential_meeting_id, contact_name, internal_note
)
SELECT
  pm.id,
  'Onur / Sarah Antor',
  'JLR CVC / InMotion Ventures contacts supplied by LVCN management.'
FROM public.potential_meetings pm
JOIN public.organisations o ON o.id = pm.organisation_id
WHERE o.name = 'PA Robotics (Powerauto Robotics)'
  AND pm.institution_name = 'In Motion Ventures (JLR CVC)'
ON CONFLICT (potential_meeting_id) DO UPDATE
SET contact_name = excluded.contact_name,
    internal_note = excluded.internal_note,
    updated_at = now();

COMMIT;
