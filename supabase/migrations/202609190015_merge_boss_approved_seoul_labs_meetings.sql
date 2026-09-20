-- LVCN management-approved UK fintech, digital-assets, regulatory and funding targets for Seoul Labs.
-- Contact details remain admin-only; every target remains visible for Seoul Labs' 1-3 rating.

BEGIN;

CREATE TEMP TABLE boss_seoul_targets (institution_name text PRIMARY KEY, required_status text NOT NULL DEFAULT 'draft') ON COMMIT DROP;
INSERT INTO boss_seoul_targets (institution_name, required_status) VALUES
  ('Monee Financial Technologies', 'draft'),
  ('FCA Innovation Hub', 'draft'), ('Digital Securities Sandbox (Bank of England)', 'draft'),
  ('Outlier Ventures', 'draft'), ('Revolut', 'draft'), ('ReStabilise', 'draft'), ('VVTX', 'draft'),
  ('Fabric Ventures', 'draft'), ('Illuminate Financial', 'draft'), ('Anthemis Group', 'draft'),
  ('Innovate Finance', 'draft'), ('Digital Catapult', 'draft'), ('Barclays', 'draft'),
  ('HSBC UK', 'draft'), ('Bank of England', 'draft'), ('Wise', 'contacted'),
  ('Tier-2 UK banks (including Sainsbury''s Bank)', 'contacted'),
  ('Financial Conduct Authority (FCA)', 'contacted'), ('Anthemis', 'draft'),
  ('Maven 11 Capital', 'draft'), ('CoinFund', 'draft'), ('Northzone', 'draft'),
  ('Balderton Capital', 'draft'), ('Octopus Ventures', 'draft'), ('Molten Ventures', 'draft'),
  ('Notion Capital', 'draft'), ('Dawn Capital', 'draft'), ('Hoxton Ventures', 'draft'),
  ('Atomico', 'draft'), ('Accel', 'draft'), ('Index Ventures', 'draft'), ('Speedinvest', 'draft'),
  ('Fin Capital', 'draft'), ('QED Investors', 'draft'), ('Portage', 'draft'),
  ('Ribbit Capital', 'draft'), ('EQT Ventures', 'draft'), ('Lakestar', 'draft'),
  ('General Catalyst', 'draft'), ('GV', 'draft'), ('SoftBank Investment Advisers', 'draft'),
  ('Prosus Ventures', 'draft'), ('Visa Ventures', 'draft'), ('Mastercard Start Path', 'draft'),
  ('Barclays Ventures', 'draft'), ('HSBC Ventures', 'draft'), ('NatWest Ventures', 'draft'),
  ('Standard Chartered Ventures', 'draft'), ('Santander InnoVentures', 'draft'),
  ('Citi Ventures', 'draft'), ('J.P. Morgan Growth Equity', 'draft'),
  ('Goldman Sachs Growth Equity', 'draft'), ('UBS Next', 'draft'),
  ('BNP Paribas Opera Tech Ventures', 'draft'), ('Société Générale Ventures', 'draft'),
  ('Circle Ventures', 'draft'), ('Ripple Ventures', 'draft'), ('Galaxy Ventures', 'draft'),
  ('Pantera Capital', 'draft'), ('Paradigm', 'draft'), ('a16z crypto', 'draft'),
  ('Polychain Capital', 'draft'), ('Electric Capital', 'draft'),
  ('British Patient Capital', 'draft'), ('Schroders Capital', 'draft'), ('M&G Catalyst', 'draft'),
  ('Blockchain.com Ventures', 'draft'), ('British Business Bank / British Patient Capital', 'draft'),
  ('Coinbase Ventures (UK-active)', 'draft'), ('LocalGlobe / Latitude', 'draft'),
  ('Passion Capital', 'draft'), ('Seedcamp', 'draft'), ('Anthemis Exponential Ventures', 'draft'),
  ('Anthos Capital / Dawn Capital', 'draft'), ('Concept Ventures', 'draft'),
  ('Episode 1 Ventures', 'draft'), ('FCA Regulatory Sandbox network / affiliated funds', 'draft'),
  ('Fidelity International Strategic Ventures (UK)', 'draft'), ('Force Over Mass', 'draft'),
  ('Global Brain / SBI Group (UK arm)', 'draft'), ('Hashkey Capital (UK presence)', 'draft'),
  ('Kindred Capital', 'draft'), ('Lloyds Banking Group Ventures', 'draft'),
  ('London Co-Investment Fund', 'draft'), ('MMC Ventures', 'draft'),
  ('Mastercard (UK/Europe innovation arm)', 'draft'), ('NatWest innovation arm', 'draft'),
  ('Playfair Capital', 'draft'), ('Talis Capital', 'draft'),
  ('UK Innovation & Science Seed Fund (UKI2S)', 'draft'), ('White Star Capital', 'draft'),
  ('abrdn (digital assets exploration)', 'draft')
ON CONFLICT (institution_name) DO UPDATE SET required_status = CASE
  WHEN EXCLUDED.required_status = 'contacted' THEN 'contacted' ELSE boss_seoul_targets.required_status END;

WITH target_org AS (SELECT id FROM public.organisations WHERE name = 'Seoul Labs')
INSERT INTO public.potential_meetings (
  id, organisation_id, institution_name, category, status, proposed_starts_at, proposed_ends_at,
  location, external_url, startup_visible_note, next_action, owner_profile_id, created_by,
  created_at, updated_at, legacy_schedule_item_id, uk_relevance_status, uk_presence_type,
  uk_presence_location, uk_evidence_url, uk_fit_rationale, uk_review_note, uk_reviewed_at, uk_reviewed_by
)
SELECT a.id, a.organisation_id, a.institution_name, a.category, t.required_status::public.potential_meeting_status,
  a.proposed_starts_at, a.proposed_ends_at, a.location, a.external_url, a.startup_visible_note,
  'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.',
  a.owner_profile_id, a.created_by, a.created_at, now(), a.legacy_schedule_item_id,
  'pending_review', a.uk_presence_type, a.uk_presence_location, a.uk_evidence_url, a.uk_fit_rationale,
  'Approved Seoul Labs target supplied by LVCN management.', now(), a.uk_reviewed_by
FROM public.potential_meetings_archive_20260919 a
JOIN target_org o ON o.id=a.organisation_id JOIN boss_seoul_targets t ON lower(t.institution_name)=lower(a.institution_name)
WHERE NOT EXISTS (SELECT 1 FROM public.potential_meetings pm WHERE pm.organisation_id=a.organisation_id AND lower(pm.institution_name)=lower(a.institution_name));

WITH target_org AS (SELECT id FROM public.organisations WHERE name = 'Seoul Labs'),
creator AS (SELECT pm.created_by FROM public.potential_meetings pm JOIN target_org o ON o.id=pm.organisation_id LIMIT 1)
INSERT INTO public.potential_meetings (organisation_id,institution_name,category,status,startup_visible_note,next_action,created_by,uk_relevance_status)
SELECT o.id,t.institution_name,
  CASE
    WHEN t.institution_name ~* '(fca|bank of england|innovate finance|digital catapult|sandbox)' THEN 'Regulatory / fintech ecosystem'
    WHEN t.institution_name ~* '(barclays|hsbc|revolut|wise|bank|visa|mastercard|natwest|santander|citi|j.p. morgan|goldman|ubs|bnp|société|lloyds|abrdn)' THEN 'Financial-services strategic partner'
    WHEN t.institution_name ~* '(circle|ripple|blockchain|coinbase|hashkey)' THEN 'Digital-assets strategic partner'
    ELSE 'Fintech / digital-assets investor' END,
  t.required_status::public.potential_meeting_status,
  'LVCN-approved potential relationship for Seoul Labs, relevant to regulated digital-asset infrastructure, UK financial-services adoption, sandbox participation, strategic partnership, or fintech funding.',
  CASE WHEN t.required_status='contacted' THEN 'Follow up on the sent introduction and capture Seoul Labs'' 1-3 rating.' ELSE 'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.' END,
  c.created_by,'pending_review'
FROM boss_seoul_targets t CROSS JOIN target_org o CROSS JOIN creator c
WHERE NOT EXISTS (SELECT 1 FROM public.potential_meetings pm WHERE pm.organisation_id=o.id AND lower(pm.institution_name)=lower(t.institution_name));

UPDATE public.potential_meetings pm
SET status=t.required_status::public.potential_meeting_status,
  uk_review_note='Approved Seoul Labs target supplied by LVCN management.', uk_reviewed_at=now(),
  next_action=CASE WHEN t.required_status='contacted' THEN 'Follow up on the sent introduction and capture Seoul Labs'' 1-3 rating.' ELSE 'Startup to rate this potential meeting from 1 to 3; LVCN will prioritise outreach using those ratings.' END
FROM public.organisations o, boss_seoul_targets t
WHERE pm.organisation_id=o.id AND o.name='Seoul Labs' AND lower(t.institution_name)=lower(pm.institution_name);

UPDATE public.potential_meetings pm
SET category=CASE
    WHEN pm.institution_name ~* '(fca|bank of england|innovate finance|digital catapult|sandbox)' THEN 'Regulatory / fintech ecosystem'
    WHEN pm.institution_name ~* '(barclays|hsbc|revolut|wise|bank|visa|mastercard|natwest|santander|citi|j.p. morgan|goldman|ubs|bnp|société|lloyds|abrdn)' THEN 'Financial-services strategic partner'
    WHEN pm.institution_name ~* '(circle|ripple|blockchain|coinbase|hashkey)' THEN 'Digital-assets strategic partner'
    ELSE pm.category END
FROM public.organisations o WHERE pm.organisation_id=o.id AND o.name='Seoul Labs';

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id,contact_name,contact_email,internal_note)
SELECT pm.id,'Vinay Anupindi','va@monee.io','Monee Financial Technologies contact supplied by LVCN management.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id=pm.organisation_id
WHERE o.name='Seoul Labs' AND pm.institution_name='Monee Financial Technologies'
ON CONFLICT (potential_meeting_id) DO UPDATE SET contact_name=excluded.contact_name,contact_email=excluded.contact_email,internal_note=excluded.internal_note,updated_at=now();

INSERT INTO public.potential_meeting_admin_details (potential_meeting_id,contact_name,internal_note)
SELECT pm.id,'Kushal Balluck','Bank of England Digital Securities Sandbox route; contact / organiser reference supplied by LVCN management.'
FROM public.potential_meetings pm JOIN public.organisations o ON o.id=pm.organisation_id
WHERE o.name='Seoul Labs' AND pm.institution_name='Digital Securities Sandbox (Bank of England)'
ON CONFLICT (potential_meeting_id) DO UPDATE SET contact_name=excluded.contact_name,internal_note=excluded.internal_note,updated_at=now();

COMMIT;
