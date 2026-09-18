-- Curated, startup-specific Potential Biz Meets for the three remaining SVC 2026 companies.
-- Safe to run in the Supabase SQL Editor.  It does not change schema, schedules,
-- organisation links, existing records, or records for any other startup.
-- It only inserts a row when the same organisation and institution name are absent.
do $$
declare
  admin_id uuid;
begin
  select id into admin_id
  from public.profiles
  where role = 'lvnc_admin'
  order by created_at
  limit 1;

  if admin_id is null then
    raise exception 'No LVCN admin profile exists. Sign in once as an LVCN admin, then rerun this script.';
  end if;

  with candidates (organisation_slug, institution_name, category, external_url, startup_visible_note, next_action) as (
    values
      -- JIRO / Dropshot AI: agency and brand pilots, content rights, compliance, Series B.
      ('jiro-dropshot-ai', 'IAB UK', 'Advertising / AI industry network', 'https://www.iabuk.com/ai-digital-advertising', 'UK digital-advertising network and practical AI guidance. A route to agencies, advertisers and AI-content thought leadership.', 'Request an introduction to AI, creative or member-programme leads; assess a UK agency pilot route.'),
      ('jiro-dropshot-ai', 'Institute of Practitioners in Advertising (IPA)', 'Advertising agencies', 'https://ipa.co.uk/', 'UK agency trade body. Relevant for warm access to agency decision-makers who can sponsor a brand-safe generative-video pilot.', 'Request introductions to member agencies with e-commerce, FMCG or high-volume video-production clients.'),
      ('jiro-dropshot-ai', 'ISBA', 'Advertiser network', 'https://www.isba.org.uk/', 'Advertiser association. Useful for reaching brand-side marketing, procurement and legal stakeholders together, which matches Dropshot AI''s enterprise buying process.', 'Identify an AI-content or brand-safety working group and request relevant advertiser introductions.'),
      ('jiro-dropshot-ai', 'BIMA', 'Digital / creative network', 'https://bima.co.uk/', 'UK digital and creative community with agencies and technology partners; suitable for a first European case-study and channel conversations.', 'Request a member introduction or showcase opportunity for a rights-cleared generative-video workflow.'),
      ('jiro-dropshot-ai', 'Creative UK', 'Creative industries network', 'https://www.wearecreative.uk/', 'UK creative-industries network relevant to content, screen, advertising and commercialisation partnerships.', 'Explore a partner introduction to content producers, agencies or creative-tech programmes.'),
      ('jiro-dropshot-ai', 'Clearcast', 'Advertising clearance / compliance', 'https://clearcast.co.uk/', 'UK TV-ad clearance expertise is a high-signal route to understand approval expectations for AI-assisted commercial content.', 'Request an exploratory conversation on evidence, disclosure and clearance considerations for AI-generated advertising assets.'),
      ('jiro-dropshot-ai', 'DEPT', 'Digital agency / enterprise pilot', 'https://www.deptagency.com/', 'International digital agency with commerce and brand-transformation work; potential enterprise pilot and channel partner.', 'Request a warm introduction to UK or Netherlands commerce and creative leadership for a scoped pilot.'),
      ('jiro-dropshot-ai', 'dentsu Creative', 'Advertising agency / enterprise pilot', 'https://www.dentsucreative.com/', 'Global agency network with UK and European client relationships; potential buyer, pilot partner and enterprise reference route.', 'Identify a generative-AI, commerce or production-operations lead and propose a rights-cleared video pilot.'),
      ('jiro-dropshot-ai', 'WPP', 'Advertising / strategic partnership', 'https://www.wpp.com/', 'Global agency group with major UK and European brands. Relevant for a carefully positioned production-workflow partnership rather than a broad product pitch.', 'Request a targeted introduction to an AI production, commerce-content or innovation lead.'),
      ('jiro-dropshot-ai', 'ICO Innovation Hub', 'Data protection / regulatory', 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/innovation-advice/', 'Practical UK data-protection engagement route while JIRO completes its GDPR data-processing and AI-content compliance package.', 'Assess eligibility for innovation advice; prepare a concise data-flow and rights-management briefing.'),
      ('jiro-dropshot-ai', 'NVIDIA Inception', 'Technology / ecosystem', 'https://www.nvidia.com/en-gb/startups/', 'Existing programme relationship that may provide European ecosystem visibility and introductions; do not duplicate existing account contacts without checking ownership.', 'Confirm whether a European go-to-market or agency introduction can be facilitated through the existing NVIDIA relationship.'),
      ('jiro-dropshot-ai', 'Balderton Capital', 'Investor', 'https://www.balderton.com/', 'European technology investor relevant to a future Series B and enterprise-software expansion.', 'Request a targeted introduction once European pilot evidence and the compliance pack are ready.'),

      -- PA Robotics: manufacturing PoCs, integrator channels, CE/machinery readiness, strategic capital.
      ('pa-robotics', 'Manufacturing Technology Centre (MTC)', 'Manufacturing R&D / robotics', 'https://www.the-mtc.org/about/technologies-and-capabilities/automation-robotics', 'High-value UK robotics and automation partner. Its Robot Experience Centre and integrator network are directly relevant to validating odd-form assembly and vision-inspection applications.', 'Request a technical-commercial scoping call focused on an assembly automation demonstration or manufacturer introduction.'),
      ('pa-robotics', 'MTC Automation and Robotics Technology Accelerator (AURA)', 'Accelerator / manufacturing', 'https://www.the-mtc.org/automation-and-robotics-accelerator-programme', 'MTC programme offers engineering support, industrial connections and manufacturing/investor introductions for robotics companies.', 'Confirm international-company eligibility and the next application or workshop route.'),
      ('pa-robotics', 'High Value Manufacturing Catapult', 'Manufacturing innovation network', 'https://hvm.catapult.org.uk/', 'UK manufacturing innovation network; relevant for testbed access, UK market navigation and sector-specific introductions.', 'Request an introduction to the appropriate automation, electronics, battery or automotive centre.'),
      ('pa-robotics', 'Made Smarter', 'Manufacturing adoption network', 'https://www.madesmarter.uk/', 'UK industrial-digitalisation programme with manufacturing SME and adoption-network relevance.', 'Explore partner and manufacturer-introduction routes; position PAIS vision inspection and odd-form assembly use cases.'),
      ('pa-robotics', 'Make UK', 'Manufacturing industry network', 'https://www.makeuk.org/', 'UK manufacturers'' association and a route to prospective adopters, market insight and industrial events.', 'Request introductions to manufacturers with labour-intensive assembly or quality-consistency challenges.'),
      ('pa-robotics', 'Siemens Digital Industries', 'Industrial automation / strategic partner', 'https://www.siemens.com/global/en/products/automation.html', 'Potential strategic partner for industrial automation, MES integration and European customer pathways.', 'Request a targeted discussion on compatible manufacturing-integration and channel opportunities.'),
      ('pa-robotics', 'ABB Robotics', 'Robotics / strategic partner', 'https://new.abb.com/products/robotics', 'Global robotics player potentially relevant to hardware ecosystem, integrator relationships and customer referrals.', 'Identify a UK or European business-development lead for an odd-form assembly and AI-vision use-case discussion.'),
      ('pa-robotics', 'FANUC UK', 'Robotics / systems integration', 'https://www.fanuc.eu/uk/en', 'Robotics supplier with UK manufacturing footprint; assess interoperability, integrator and joint-demo possibilities.', 'Request a technical-commercial introduction for a compatible assembly automation deployment discussion.'),
      ('pa-robotics', 'KUKA', 'Robotics / systems integration', 'https://www.kuka.com/', 'European industrial-robotics player relevant to integration and customer pathways for dark-factory deployments.', 'Identify a UK, Netherlands or Spain partnership lead for a scoped system-integration conversation.'),
      ('pa-robotics', 'TUV SUD', 'CE / machinery compliance', 'https://www.tuvsud.com/en/industries/manufacturing/machinery-and-plant-engineering', 'Independent machinery, functional-safety and conformity-assessment expertise relevant to EU market entry.', 'Request a paid or introductory gap assessment for machinery safety, EMC and CE technical documentation.'),
      ('pa-robotics', 'BSI', 'CE / machinery compliance', 'https://www.bsigroup.com/en-GB/industries-and-sectors/manufacturing/', 'UK standards and assurance route for structured EU/UK market-entry preparation; do not represent this as certification engagement until confirmed.', 'Request guidance on applicable machinery, safety, EMC and quality-management standards.'),
      ('pa-robotics', 'Advanced Propulsion Centre UK', 'Automotive / battery manufacturing', 'https://www.apcuk.co.uk/', 'UK automotive and battery-manufacturing ecosystem with potential PoC and strategic manufacturer routes.', 'Request an introduction to electrified-vehicle or battery-manufacturing innovation contacts relevant to assembly automation.'),
      ('pa-robotics', 'UK Battery Industrialisation Centre', 'Battery manufacturing / pilot', 'https://www.ukbic.co.uk/', 'Battery-manufacturing facility and ecosystem route that aligns with PA Robotics'' target sector and quality-critical production use cases.', 'Explore a demonstration, technical exchange or relevant manufacturer introduction.'),
      ('pa-robotics', 'Octopus Ventures', 'Investor', 'https://octopusventures.com/', 'UK venture investor; assess industrial automation, deep-tech and growth-stage fit before outreach.', 'Identify the relevant deep-tech or industrial-investment partner and request a targeted introduction.'),
      ('pa-robotics', 'EQT Ventures', 'Investor', 'https://eqtventures.com/', 'European technology investor; evaluate fit for a bridge/pre-IPO round and international scale-up.', 'Request an introduction only after confirming current robotics/manufacturing investment appetite.'),

      -- YepBio: Parkinson''s research, CNS licensing, clinical evidence and Series A.
      ('yepbio', 'Parkinson''s UK Research Ventures', 'Parkinson''s research / partnering', 'https://www.parkinsons.org.uk/research/researchers/parkinsons-research-ventures/work-with-us', 'European Parkinson''s research funder and partner for drug-development projects; directly relevant to PARIS-targeted disease-modifying therapy and patient-focused evidence planning.', 'Request a scientific-business-development discussion on therapeutic, biomarker and patient-involvement fit.'),
      ('yepbio', 'Cure Parkinson''s', 'Parkinson''s research / clinical trials', 'https://cureparkinsons.org.uk/', 'Parkinson''s-focused research charity and clinical-trials ecosystem relevant to disease-modifying therapy development.', 'Request an introduction to research or trial-development contacts; present YPD-01 and biomarker strategy accurately as preclinical/IND-ready.'),
      ('yepbio', 'Parkinson''s Clinical Cohorts Collaborative (PC3)', 'Clinical research / biomarker', 'https://www.parkinsons.org.uk/news/2026/harnessing-power-patient-data-to-accelerate-new-treatments-for-parkinsons', 'UK-led collaborative patient-data initiative relevant to biomarker validation and future study-design insight.', 'Identify the appropriate academic or programme contact; ask about collaboration requirements rather than patient-data access.'),
      ('yepbio', 'UCL Queen Square Institute of Neurology', 'Academic / clinical research', 'https://www.ucl.ac.uk/ion/', 'Major UK neurology and Parkinson''s research centre; high-value KOL, translational-research and trial-design route.', 'Request an introduction to Parkinson''s translational research or clinical-trials leadership.'),
      ('yepbio', 'NIHR University College London Hospitals Biomedical Research Centre', 'Clinical research infrastructure', 'https://www.uclhospitals.brc.nihr.ac.uk/', 'NIHR translational-research infrastructure relevant to biomarker evidence, clinical-study feasibility and academic collaboration.', 'Ask for the appropriate neuroscience, biomarker or early-phase trials route.'),
      ('yepbio', 'Medicines Discovery Catapult', 'Drug discovery / translational support', 'https://md.catapult.org.uk/', 'UK translational drug-discovery organisation; evaluate support for CNS development, biomarkers and partner introductions.', 'Request an exploratory discussion on the most relevant translational, assay or partnership route.'),
      ('yepbio', 'MHRA Innovation Office', 'Regulatory / market access', 'https://www.gov.uk/guidance/innovative-devices-access-pathway-idap', 'UK regulatory engagement route. Scope the discussion carefully: YPD-01 is a medicine programme and the companion diagnostic has a separate IVDR pathway.', 'Assess the appropriate MHRA innovation or scientific-advice route; prepare separate medicine and diagnostic questions.'),
      ('yepbio', 'NICE Scientific Advice', 'Market access / evidence', 'https://www.nice.org.uk/about/what-we-do/life-sciences/scientific-advice', 'Early evidence and value-strategy route for future UK access planning; appropriate timing should be assessed against YPD-01 development stage.', 'Assess the timing and scope of an early evidence-planning discussion.'),
      ('yepbio', 'UCB', 'Pharma / CNS partnering', 'https://www.ucb.com/', 'Global neurology company with Parkinson''s research experience; potential licensing or co-development conversation, subject to programme-fit review.', 'Identify a CNS business-development contact and request a confidential, non-promotional introductory discussion.'),
      ('yepbio', 'Lundbeck', 'Pharma / CNS partnering', 'https://www.lundbeck.com/', 'CNS-focused pharmaceutical company; potential out-licensing or co-development fit for an IND-ready Parkinson''s asset.', 'Identify a neuroscience business-development contact and request a targeted introduction.'),
      ('yepbio', 'Roche / Genentech Partnering', 'Pharma / CNS partnering', 'https://www.roche.com/partnering', 'Global pharma partnering route; evaluate strategic fit for disease-modifying Parkinson''s and biomarker-enabled development.', 'Prepare a non-confidential teaser and request the appropriate neuroscience partnering route.'),
      ('yepbio', 'Biogen Business Development', 'Pharma / CNS partnering', 'https://www.biogen.com/', 'CNS-focused company with relevant disease-area experience. YepBio has an advisor with Biogen background, so coordinate before any outreach.', 'Confirm relationship ownership internally, then decide whether a senior BD introduction is appropriate.'),
      ('yepbio', 'Syncona', 'Investor / life sciences', 'https://www.synconaltd.com/', 'UK life-sciences investor relevant to a Series A and therapeutics company-building discussion.', 'Request a targeted introduction after validating stage, geography and CNS investment fit.'),
      ('yepbio', 'SV Health Investors', 'Investor / life sciences', 'https://svhealthinvestors.com/', 'Specialist healthcare investor; relevant to Series A and biomarker-enabled therapeutics.', 'Identify the appropriate biotech or dementia/neuro investment team and request a targeted introduction.'),
      ('yepbio', 'Forbion', 'Investor / life sciences', 'https://forbion.com/', 'European life-sciences investor suitable for an IND-ready, platform-led CNS company if mandate and stage align.', 'Confirm current CNS and Series A mandate, then request a focused introduction.'),
      ('yepbio', 'Medicxi', 'Investor / life sciences', 'https://medicxi.com/', 'European life-sciences investor with drug-development expertise; assess suitability for early clinical and licensing strategy.', 'Request a targeted introduction once the Phase 1 and EU roadmap are clearly packaged.')
  )
  insert into public.potential_meetings
    (organisation_id, institution_name, category, status, external_url, startup_visible_note, next_action, created_by)
  select o.id, c.institution_name, c.category, 'draft', c.external_url, c.startup_visible_note, c.next_action, admin_id
  from candidates c
  join public.organisations o on o.slug = c.organisation_slug
  where not exists (
    select 1
    from public.potential_meetings pm
    where pm.organisation_id = o.id
      and pm.institution_name = c.institution_name
  );
end $$;

-- Optional verification: expect 12 JIRO, 15 PA Robotics and 16 YepBio rows after a first successful run.
select o.name as organisation, count(pm.id) as potential_meeting_count
from public.organisations o
left join public.potential_meetings pm on pm.organisation_id = o.id
where o.slug in ('jiro-dropshot-ai', 'pa-robotics', 'yepbio')
group by o.name
order by o.name;
