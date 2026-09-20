-- First curated UK meeting cohort, selected from the active startups' applications.
-- All other legacy/generated rows remain pending_review and are hidden from startups.

WITH curated (
  startup, institution_name, uk_presence_type, uk_presence_location, uk_evidence_url, uk_fit_rationale
) AS (
  VALUES
    -- Deep Fusion AI: radar perception, automotive, dual-use and defence PoCs.
    ('Deep Fusion AI', 'BAE Systems (FalconWorks)', 'office', 'United Kingdom', 'https://www.baesystems.com/', 'UK defence and advanced-technology route for radar-perception and autonomous-system PoCs.'),
    ('Deep Fusion AI', 'Chess Dynamics (Elbit Systems UK)', 'subsidiary', 'United Kingdom', 'https://elbitsystems-uk.com/', 'UK defence-systems partner relevant to sensing, autonomy and dual-use deployment.'),
    ('Deep Fusion AI', 'Cohort plc', 'headquarters', 'United Kingdom', 'https://www.cohortplc.com/', 'UK defence and security group with potential sensor and autonomy partnership routes.'),
    ('Deep Fusion AI', 'DASA (Defence and Security Accelerator)', 'office', 'United Kingdom', 'https://www.gov.uk/government/organisations/defence-and-security-accelerator', 'UK Ministry of Defence innovation route for dual-use radar and autonomy validation.'),
    ('Deep Fusion AI', 'Dstl', 'office', 'United Kingdom', 'https://www.gov.uk/government/organisations/defence-science-and-technology-laboratory', 'UK defence science route for relevant sensing and autonomous-systems research engagement.'),
    ('Deep Fusion AI', 'QinetiQ', 'headquarters', 'United Kingdom', 'https://www.qinetiq.com/', 'UK defence and technology company relevant to autonomy, sensing and trials.'),
    ('Deep Fusion AI', 'Saab UK', 'subsidiary', 'United Kingdom', 'https://www.saab.com/markets/united-kingdom', 'UK operating subsidiary relevant to defence, surveillance and autonomy systems.'),
    ('Deep Fusion AI', 'Thales UK', 'subsidiary', 'United Kingdom', 'https://www.thalesgroup.com/en/countries/europe/united-kingdom', 'UK operating subsidiary with defence, transport and sensor-system activities.'),
    ('Deep Fusion AI', 'Smart Mobility Living Lab', 'office', 'London', 'https://smartmobility.london/', 'London testbed route for real-vehicle autonomous-mobility validation.'),
    ('Deep Fusion AI', 'Zenzic', 'office', 'United Kingdom', 'https://zenzic.io/', 'UK connected-and-automated-mobility ecosystem route for trials and partners.'),

    -- Dotter: cardiovascular devices, clinical evidence, regulatory and commercialisation.
    ('Dotter', 'Barts Heart Centre (Barts Health NHS Trust)', 'office', 'London', 'https://www.bartshealth.nhs.uk/barts-heart-centre', 'High-volume UK cardiac centre relevant to coronary-device clinical evaluation and KOL engagement.'),
    ('Dotter', 'Royal Brompton Hospital', 'office', 'London', 'https://www.rbht.nhs.uk/', 'UK specialist cardiovascular hospital route for clinical and investigator discussions.'),
    ('Dotter', 'British Heart Foundation', 'headquarters', 'United Kingdom', 'https://www.bhf.org.uk/', 'UK cardiovascular research and clinical-network route relevant to evidence and KOL access.'),
    ('Dotter', 'ProPharma', 'office', 'United Kingdom', 'https://www.propharmagroup.com/', 'UK regulatory and clinical-development support relevant to European medical-device market entry.'),
    ('Dotter', 'Syncona', 'headquarters', 'London', 'https://www.synconaltd.com/', 'UK life-sciences investor with company-building expertise for capital-intensive clinical development.'),
    ('Dotter', 'SV Health Investors', 'office', 'London', 'https://svhealthinvestors.com/', 'London-based healthcare investor relevant to clinical-stage medtech and life-science financing.'),
    ('Dotter', 'Advent Life Sciences', 'office', 'London', 'https://adventls.com/', 'London life-sciences investor relevant to medical-device commercialisation and financing.'),
    ('Dotter', 'Cambridge Innovation Capital', 'office', 'Cambridge', 'https://www.cic.vc/', 'UK deep-tech and life-sciences investor with Cambridge clinical and technology network access.'),

    -- FUST Lab: PFAS destruction pilots with UK water operators and sector bodies.
    ('FUST Lab', 'Anglian Water - FUST Lab introduction', 'office', 'United Kingdom', 'https://www.anglianwater.co.uk/', 'UK water utility pilot route for PFAS treatment technology.'),
    ('FUST Lab', 'British Water / Ofwat Innovation Fund - FUST Lab introduction', 'office', 'United Kingdom', 'https://www.britishwater.co.uk/', 'UK water-sector and innovation-fund route for pilot partners.'),
    ('FUST Lab', 'Clean Growth Fund - FUST Lab introduction', 'office', 'United Kingdom', 'https://www.cleangrowthfund.com/', 'UK climate-tech investor relevant to commercial-scale water-treatment deployment.'),
    ('FUST Lab', 'Dwr Cymru Welsh Water - PFAS treatment pilot - FUST Lab introduction', 'office', 'Wales', 'https://www.dwrcymru.com/', 'UK water-utility PFAS pilot route.'),
    ('FUST Lab', 'PureTerra Ventures - FUST Lab introduction', 'office', 'London', 'https://pureterracapital.com/', 'UK water and environmental technology investor relevant to treatment pilots.'),
    ('FUST Lab', 'Scottish Water - FUST Lab introduction', 'office', 'Scotland', 'https://www.scottishwater.co.uk/', 'UK water-utility route for treatment demonstration.'),
    ('FUST Lab', 'Severn Trent - FUST Lab introduction', 'office', 'United Kingdom', 'https://www.stwater.co.uk/', 'UK water-utility route for PFAS treatment pilot discussions.'),
    ('FUST Lab', 'SUEZ UK - FUST Lab introduction', 'subsidiary', 'United Kingdom', 'https://www.suez.co.uk/', 'UK operating water and waste-treatment partner for deployment discussions.'),
    ('FUST Lab', 'Systemiq Capital - FUST Lab introduction', 'office', 'London', 'https://systemiqcapital.com/', 'UK climate-tech investor relevant to industrial water-treatment scale-up.'),
    ('FUST Lab', 'Thames Water - FUST Lab introduction', 'office', 'London', 'https://www.thameswater.co.uk/', 'UK water-utility route for PFAS treatment pilot discussions.'),
    ('FUST Lab', 'UKWIR - FUST Lab introduction', 'office', 'United Kingdom', 'https://ukwir.org/', 'UK water-industry research route for utility pilots and technical validation.'),
    ('FUST Lab', 'United Utilities - FUST Lab introduction', 'office', 'United Kingdom', 'https://www.unitedutilities.com/', 'UK water-utility route for PFAS treatment pilot discussions.'),
    ('FUST Lab', 'Veolia UK - PFAS pilot pathway - FUST Lab introduction', 'subsidiary', 'United Kingdom', 'https://www.veolia.co.uk/', 'UK operating water-treatment and environmental-services partner.'),
    ('FUST Lab', 'Wessex Water - PFAS treatment pilot - FUST Lab introduction', 'office', 'United Kingdom', 'https://www.wessexwater.co.uk/', 'UK water-utility route for PFAS treatment pilot discussions.'),
    ('FUST Lab', 'Yorkshire Water - FUST Lab introduction', 'office', 'United Kingdom', 'https://www.yorkshirewater.com/', 'UK water-utility route for PFAS treatment pilot discussions.'),

    -- HME Square: non-invasive glucose monitoring, pharmacy, clinical adoption and UK regulation.
    ('HME Square', 'Abbott Diabetes Care UK', 'subsidiary', 'United Kingdom', 'https://www.abbott.co.uk/', 'UK diabetes-monitoring market and strategic-partner route for non-invasive glucose monitoring.'),
    ('HME Square', 'ABHI', 'office', 'London', 'https://www.abhi.org.uk/', 'UK medical-technology industry route for market access and policy engagement.'),
    ('HME Square', 'Boots UK', 'headquarters', 'United Kingdom', 'https://www.boots-uk.com/', 'UK pharmacy and consumer-health channel relevant to a wellness-device route.'),
    ('HME Square', 'Breakthrough T1D UK', 'office', 'United Kingdom', 'https://breakthrought1d.org.uk/', 'UK diabetes community and patient-engagement route.'),
    ('HME Square', 'Community Pharmacy England', 'office', 'United Kingdom', 'https://cpe.org.uk/', 'UK community-pharmacy route for distribution and adoption discussions.'),
    ('HME Square', 'Dexcom UK', 'subsidiary', 'United Kingdom', 'https://www.dexcom.com/en-GB', 'UK diabetes-monitoring market and strategic partnership route.'),
    ('HME Square', 'Diabetes UK', 'headquarters', 'United Kingdom', 'https://www.diabetes.org.uk/', 'UK diabetes patient and evidence ecosystem route.'),
    ('HME Square', 'DigitalHealth.London / Health Innovation Network South London', 'office', 'London', 'https://digitalhealth.london/', 'London NHS innovation route for clinical validation and adoption.'),
    ('HME Square', 'Bupa', 'headquarters', 'United Kingdom', 'https://www.bupa.co.uk/', 'UK health and wellness channel relevant to employer and payer discussions.'),
    ('HME Square', 'Well Pharmacy', 'office', 'United Kingdom', 'https://well.co.uk/', 'UK pharmacy distribution route for a consumer wellness device.'),
    ('HME Square', 'Vitality', 'office', 'United Kingdom', 'https://www.vitality.co.uk/', 'UK insurer and corporate-wellness route for prevention and monitoring.'),

    -- Jiro/Dropshot AI: UK agency, media, brand and compliance routes - not generic US venture funds.
    ('Jiro Inc. (Dropshot AI)', 'Advertising Standards Authority', 'office', 'London', 'https://www.asa.org.uk/', 'UK advertising-compliance route for AI-generated marketing content.'),
    ('Jiro Inc. (Dropshot AI)', 'BIMA', 'office', 'United Kingdom', 'https://bima.co.uk/', 'UK digital and creative-agency network for enterprise pilot introductions.'),
    ('Jiro Inc. (Dropshot AI)', 'Clearcast', 'office', 'London', 'https://www.clearcast.co.uk/', 'UK advertising-clearance route relevant to rights-safe AI video.'),
    ('Jiro Inc. (Dropshot AI)', 'dentsu UK', 'office', 'London', 'https://www.dentsu.com/uk/en', 'UK agency route for rights-cleared enterprise video-production pilots.'),
    ('Jiro Inc. (Dropshot AI)', 'Publicis (UK office)', 'office', 'London', 'https://www.publicisgroupe.com/en/our-operations/united-kingdom', 'UK agency route for brand and commerce pilot opportunities.'),
    ('Jiro Inc. (Dropshot AI)', 'S4 Capital', 'headquarters', 'London', 'https://www.s4capital.com/', 'London marketing and content-services group relevant to enterprise video pilots.'),
    ('Jiro Inc. (Dropshot AI)', 'WPP (UK office)', 'headquarters', 'London', 'https://www.wpp.com/', 'UK agency and brand network relevant to enterprise content-production pilots.'),
    ('Jiro Inc. (Dropshot AI)', 'The Brandtech Group', 'headquarters', 'London', 'https://www.brandtechgroup.com/', 'London marketing-technology and content network relevant to AI video partnerships.'),
    ('Jiro Inc. (Dropshot AI)', 'Seedcamp', 'office', 'London', 'https://seedcamp.com/', 'UK seed investor and ecosystem route relevant to planned European fundraising.'),
    ('Jiro Inc. (Dropshot AI)', 'Balderton Capital', 'office', 'London', 'https://www.balderton.com/', 'London technology investor relevant to a future Series B and UK expansion.'),

    -- PA Robotics: UK manufacturing, automation and industrial-pilot routes.
    ('PA Robotics (Powerauto Robotics)', 'ABB UK', 'subsidiary', 'United Kingdom', 'https://new.abb.com/uk', 'UK industrial automation partner relevant to robotics, assembly and inspection deployment.'),
    ('PA Robotics (Powerauto Robotics)', 'Advanced Propulsion Centre UK', 'office', 'United Kingdom', 'https://www.apcuk.co.uk/', 'UK automotive and advanced-manufacturing network for industrial pilot introductions.'),
    ('PA Robotics (Powerauto Robotics)', 'AMRC, Sheffield', 'office', 'Sheffield', 'https://www.amrc.co.uk/', 'UK advanced-manufacturing research centre relevant to robotics validation and industry access.'),
    ('PA Robotics (Powerauto Robotics)', 'BSI', 'headquarters', 'United Kingdom', 'https://www.bsigroup.com/', 'UK standards and certification route for industrial product readiness.'),
    ('PA Robotics (Powerauto Robotics)', 'Rockwell Automation UK', 'subsidiary', 'United Kingdom', 'https://www.rockwellautomation.com/en-gb.html', 'UK industrial automation route for factory integration and channel discussions.'),
    ('PA Robotics (Powerauto Robotics)', 'Rolls-Royce (advanced manufacturing)', 'headquarters', 'United Kingdom', 'https://www.rolls-royce.com/', 'UK advanced-manufacturing customer and pilot route.'),
    ('PA Robotics (Powerauto Robotics)', 'Siemens Digital Industries UK', 'subsidiary', 'United Kingdom', 'https://www.siemens.com/uk/en.html', 'UK industrial-automation partner route for manufacturing integration.'),
    ('PA Robotics (Powerauto Robotics)', 'UK Battery Industrialisation Centre', 'office', 'Coventry', 'https://www.ukbic.co.uk/', 'UK battery-manufacturing test and pilot route.'),
    ('PA Robotics (Powerauto Robotics)', 'Warwick Manufacturing Group', 'office', 'Coventry', 'https://warwick.ac.uk/fac/sci/wmg/', 'UK manufacturing R&D route for automation and factory pilot work.'),
    ('PA Robotics (Powerauto Robotics)', 'Development Bank of Wales', 'office', 'Wales', 'https://developmentbank.wales/', 'UK regional investment and industrial-growth finance route.'),

    -- Seoul Labs: regulated digital-asset, financial-infrastructure and UK fintech routes.
    ('Seoul Labs', 'Bank of England Digital Securities Sandbox', 'office', 'London', 'https://www.bankofengland.co.uk/financial-market-infrastructure/digital-securities-sandbox', 'UK financial-market-infrastructure sandbox relevant to regulated tokenisation and digital-asset operations.'),
    ('Seoul Labs', 'Barclays', 'headquarters', 'London', 'https://home.barclays/', 'UK bank and financial-infrastructure route for regulated payments and tokenisation discussions.'),
    ('Seoul Labs', 'Digital Catapult', 'office', 'London', 'https://www.digicatapult.org.uk/', 'UK deep-tech and digital-infrastructure ecosystem route for enterprise and public-sector engagement.'),
    ('Seoul Labs', 'Anthemis', 'office', 'London', 'https://www.anthemi.com/', 'London fintech investor relevant to regulated financial-infrastructure and payments expansion.'),
    ('Seoul Labs', 'Seedcamp', 'office', 'London', 'https://seedcamp.com/', 'UK fintech and technology investor network relevant to Series A and London entry.'),
    ('Seoul Labs', 'SFC Capital', 'office', 'London', 'https://www.sfccapital.com/', 'UK early-stage investor and enterprise network relevant to UK market entry.'),

    -- YepBio: Parkinsons therapeutics, UK research, partnering and specialist life-sciences capital.
    ('YepBio', 'UCL Queen Square Institute of Neurology', 'office', 'London', 'https://www.ucl.ac.uk/ion/', 'UK Parkinsons and neurology research centre relevant to translational research and clinical collaboration.'),
    ('YepBio', 'UK Dementia Research Institute', 'office', 'United Kingdom', 'https://ukdri.ac.uk/', 'UK neuroscience research route relevant to disease-modifying Parkinsons work.'),
    ('YepBio', 'Cure Parkinson''s', 'office', 'United Kingdom', 'https://cureparkinsons.org.uk/', 'UK Parkinsons research and trial ecosystem route.'),
    ('YepBio', 'British Neuroscience Association representatives', 'office', 'United Kingdom', 'https://www.bna.org.uk/', 'UK neuroscience KOL and research-network route.'),
    ('YepBio', 'Dr Emma Lawrence - BIA TechBio community', 'office', 'United Kingdom', 'https://www.bioindustry.org/', 'UK TechBio industry route for partnering and investor introductions.'),
    ('YepBio', 'Syncona', 'headquarters', 'London', 'https://www.synconaltd.com/', 'UK life-sciences investor and company-builder relevant to a Series A therapeutic programme.'),
    ('YepBio', 'SV Health Investors', 'office', 'London', 'https://svhealthinvestors.com/', 'London healthcare investor relevant to clinical-stage therapeutics financing.'),
    ('YepBio', 'Advent Life Sciences', 'office', 'London', 'https://adventls.com/', 'London life-sciences investor relevant to therapeutic development and financing.'),
    ('YepBio', '4BIO Capital', 'office', 'London', 'https://4biocapital.com/', 'UK life-sciences investor relevant to early clinical therapeutics.'),
    ('YepBio', 'Cambridge Innovation Capital', 'office', 'Cambridge', 'https://www.cic.vc/', 'UK life-sciences investor and Cambridge ecosystem route.'),
    ('YepBio', 'UCB', 'subsidiary', 'United Kingdom', 'https://www.ucb.com/', 'UK operating biopharma partner relevant to neurology business-development discussion.')
)
UPDATE public.potential_meetings AS pm
SET
  uk_relevance_status = 'approved',
  uk_presence_type = curated.uk_presence_type,
  uk_presence_location = curated.uk_presence_location,
  uk_evidence_url = curated.uk_evidence_url,
  uk_fit_rationale = curated.uk_fit_rationale,
  uk_review_note = 'Curated against the startup''s SVC application and verified for UK operating presence.',
  uk_reviewed_at = now(),
  location = coalesce(nullif(pm.location, ''), curated.uk_presence_location),
  external_url = coalesce(nullif(pm.external_url, ''), curated.uk_evidence_url),
  startup_visible_note = curated.uk_fit_rationale,
  next_action = 'LVCN to identify the appropriate UK contact and request a targeted introductory meeting.'
FROM curated
JOIN public.organisations AS o
  ON o.name = curated.startup
WHERE pm.organisation_id = o.id
  AND pm.institution_name = curated.institution_name;

-- Confirm the curated rows that are now startup-visible.
SELECT
  o.name AS startup,
  pm.institution_name,
  pm.uk_presence_location,
  pm.uk_relevance_status
FROM public.potential_meetings AS pm
JOIN public.organisations AS o ON o.id = pm.organisation_id
WHERE pm.uk_relevance_status = 'approved'
ORDER BY o.name, pm.institution_name;
