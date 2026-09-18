-- HME Square: curated, startup-specific Potential Biz Meets and schedule.
-- Run after 202609170007_dedicated_potential_biz_meets.sql.
do $$
declare
  admin_id uuid;
  hme_id uuid;
begin
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  select id into hme_id from public.organisations where slug = 'hme-square';
  if admin_id is null or hme_id is null then
    raise exception 'An LVCN admin profile and HME Square organisation are required.';
  end if;

  insert into public.potential_meetings (organisation_id, institution_name, category, status, external_url, startup_visible_note, next_action, created_by)
  select hme_id, institution_name, category, 'contacted', external_url, note, action, admin_id
  from (values
    ('Esther Richardot (Thena)', 'Commercial / Digital health', 'https://www.thena.ai/', 'Explore UK commercial partnership and digital-health go-to-market insight.', 'Request LVCN introduction.'),
    ('DigitalHealth.London / Health Innovation Network South London', 'NHS innovation / Clinical validation', 'https://healthinnovationnetwork.com/', 'NHS innovation-network route for pilot design and health-system adoption.', 'Request an introduction to diabetes and diagnostics leads.'),
    ('Boots UK', 'Pharmacy / Retail', 'https://www.boots-uk.com/', 'Retail-pharmacy partnership and consumer-access route for a needle-free glucose monitor.', 'Identify procurement or innovation lead.'),
    ('Well Pharmacy', 'Pharmacy / Retail', 'https://well.co.uk/', 'Community-pharmacy pathway for diabetes-monitoring distribution and patient feedback.', 'Request innovation/procurement introduction.'),
    ('Livi UK', 'Digital health', 'https://www.livi.co.uk/', 'Digital primary-care partner for diabetes pathways and remote monitoring.', 'Request clinical-product introduction.'),
    ('Diabetes UK', 'Patient / Clinical community', 'https://www.diabetes.org.uk/', 'Patient insight, diabetes-professional network and evidence communication.', 'Request relevant innovation and professional-network introduction.'),
    ('Breakthrough T1D UK', 'Patient / Clinical community', 'https://breakthrought1d.org.uk/', 'Type 1 diabetes community, research and patient-engagement relevance.', 'Request research/innovation introduction.'),
    ('Guy''s and St Thomas'' Diabetes Centre', 'Hospital / Clinical trials', 'https://www.guysandstthomas.nhs.uk/', 'High-value diabetes clinical-validation and trial-site discussion.', 'Request introduction to diabetes research leadership.'),
    ('LIHE / King''s College London', 'University / Clinical trials', 'https://www.kcl.ac.uk/', 'Academic partner for technical research, clinical study design and validation.', 'Request diabetes/medtech research introduction.'),
    ('NICE', 'Regulatory / Market access', 'https://www.nice.org.uk/', 'Early evidence and health-technology-assessment pathway for a novel glucose monitor.', 'Request early scientific advice route.'),
    ('Forbion', 'Healthcare investor', 'https://forbion.com/', 'Specialist life-sciences investor; assess diagnostics/medtech mandate.', 'Request targeted partner introduction.'),
    ('Sofinnova Partners', 'Healthcare investor', 'https://sofinnovapartners.com/', 'Specialist healthcare investor for clinical-stage diagnostics and medtech.', 'Request targeted partner introduction.'),
    ('SV Health Investors', 'Healthcare investor', 'https://svhealthinvestors.com/', 'Healthcare investor fit for clinical validation and international scale-up.', 'Request targeted partner introduction.'),
    ('Octopus Ventures', 'Investor', 'https://octopusventures.com/', 'UK venture investor; use a dedicated HME Square row, separate from any other startup relationship.', 'Identify healthcare investor contact.'),
    ('Air Street Capital', 'AI investor', 'https://www.airstreet.com/', 'AI-native investor fit for photoacoustics signal processing and personalised calibration.', 'Request targeted partner introduction.'),
    ('Hoxton Ventures', 'Investor', 'https://www.hoxtonventures.com/', 'Potential venture fit for deep-tech medical-device platform.', 'Request targeted partner introduction.'),
    ('Gilde Healthcare', 'Healthcare investor', 'https://gildehealthcare.com/', 'Specialist healthcare investor with medtech experience.', 'Request targeted partner introduction.'),
    ('EQT Life Sciences', 'Healthcare investor', 'https://eqtgroup.com/', 'Healthcare growth investor; assess stage and device mandate.', 'Request targeted partner introduction.'),
    ('Johnson & Johnson Innovation (JJDC)', 'Corporate innovation', 'https://jnjinnovation.com/', 'Strategic medtech and diabetes-care partnership discussion.', 'Request targeted introduction.'),
    ('Bupa', 'Corporate innovation', 'https://www.bupa.co.uk/', 'Potential payer/provider and preventive-health partnership route.', 'Request innovation-team introduction.'),
    ('Imperial College Healthcare NHS Trust / Imperial College London', 'Hospital / Clinical trials', 'https://www.imperial.nhs.uk/research-and-innovation', 'Diabetes, engineering and clinical-research ecosystem suitable for UK feasibility, evidence design and KOL introductions.', 'Request an introduction to diabetes, clinical-engineering or trial leadership.'),
    ('NIHR Imperial Biomedical Research Centre', 'Clinical research infrastructure', 'https://imperialbrc.nihr.ac.uk/', 'NIHR-backed translational research infrastructure relevant to early UK evidence planning and clinical-study networks.', 'Ask for the appropriate diagnostics, digital-health or clinical-trials route.'),
    ('MHRA Innovation Office', 'Regulatory / Market access', 'https://www.gov.uk/guidance/innovative-devices-access-pathway-idap', 'UK regulatory engagement route for novel medical devices, complementing the planned CE-MDR work.', 'Assess eligibility and request the appropriate innovation/regulatory advice route.'),
    ('BSI Group', 'Regulatory / Quality', 'https://www.bsigroup.com/en-GB/medical-devices/', 'Practical UK regulatory, quality-system and market-access intelligence; HME separately targets BSI NL for CE-MDR notified-body work.', 'Request regulatory-intelligence guidance; do not represent this as notified-body engagement.'),
    ('ABHI', 'Industry / Market access', 'https://www.abhi.org.uk/', 'UK HealthTech trade association connecting MedTech companies with NHS, policy, regulation and market-access stakeholders.', 'Explore membership, market-access advice and relevant introductions.'),
    ('NHS Innovation Accelerator', 'NHS innovation / Adoption', 'https://nhsaccelerator.com/', 'National NHS adoption network and a route to understand scale-up requirements for future evidence-backed deployment.', 'Request guidance on readiness criteria and relevant NHS innovation networks.'),
    ('Vitality', 'Corporate wellness', 'https://www.vitality.co.uk/', 'Potential corporate-wellness and preventive-health partner aligned to HME''s Track 1 wellness proposition.', 'Identify corporate-wellness or innovation lead.'),
    ('Abbott Diabetes Care UK', 'Strategic / Diabetes technology', 'https://www.abbott.co.uk/', 'HME reports existing NDA-stage dialogue with Abbott; coordinate carefully and avoid duplicate outreach.', 'Confirm relationship owner and whether a UK follow-up is useful.'),
    ('Dexcom UK', 'Strategic / Diabetes technology', 'https://uk.provider.dexcom.com/', 'HME reports existing NDA-stage dialogue with Dexcom; coordinate carefully and avoid duplicate outreach.', 'Confirm relationship owner before proposing a UK meeting.')
  ) as v(institution_name, category, external_url, note, action)
  where not exists (select 1 from public.potential_meetings pm where pm.organisation_id = hme_id and pm.institution_name = v.institution_name);

  insert into public.potential_meeting_admin_details (potential_meeting_id, contact_name, internal_note, updated_by)
  select id, 'Esther Richardot', 'Named contact supplied by LVCN; add email only when confirmed.', admin_id
  from public.potential_meetings where organisation_id = hme_id and institution_name = 'Esther Richardot (Thena)'
  on conflict (potential_meeting_id) do update set contact_name = excluded.contact_name, internal_note = excluded.internal_note, updated_by = excluded.updated_by;

  insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
  values
    ('Flash Glucose Monitoring Tutorial', 'Clinical diabetes-professional tutorial relevant to glucose-monitoring adoption, data interpretation and care pathways.', 'third_party', 'selected_organisations', 'recommended', '2026-10-01T00:00:00+01:00', '2026-10-02T00:00:00+01:00', 'all_day', 'London', 'https://www.diabetes.org.uk/professionals/flash-glucose-monitoring', 'unknown', 'Registration details to verify.', 'proposed', 'to_register', 'must_pursue', 'Direct relevance to professional glucose-monitoring practice.', 'Register and identify diabetes-clinician conversations.', 'HME 2026 schedule | Flash glucose', admin_id),
    ('CVRM Professional Care 2026', 'Diabetes and cardiovascular-renal-metabolic professional event.', 'third_party', 'selected_organisations', 'recommended', '2026-10-20T00:00:00+01:00', '2026-10-22T00:00:00+01:00', 'all_day', 'Olympia London', 'https://www.diabetes.org.uk/for-professionals/get-involved/conferences-and-events', 'unknown', 'Ticket details to verify.', 'proposed', 'to_register', 'must_pursue', 'Strong diabetes clinical and commercial audience.', 'Register; request meetings with diabetes clinicians and pathway leaders.', 'HME 2026 schedule | CVRM', admin_id),
    ('UCL MRC Clinical Trial Innovation Symposium', 'NIHR-linked clinical-trial innovation symposium.', 'third_party', 'selected_organisations', 'recommended', '2026-10-13T00:00:00+01:00', '2026-10-14T00:00:00+01:00', 'all_day', 'British Library, London', 'https://onlinestore.ucl.ac.uk/conferences-and-events/faculty-of-population-health-sciences-c09/institute-of-clinical-trials-and-methodology-d65/d65-mrc-core-launch-symposium-13-october-2026', 'paid', '£500; booking closes 8 October 2026.', 'proposed', 'approval_required', 'strong_option', 'Clinical-trial design and NIHR evidence-generation network.', 'Seek budget approval before booking.', 'HME 2026 schedule | UCL clinical trials', admin_id)
  on conflict do nothing;

  -- schedule_items has no unique key for source_note. Earlier HME runs therefore
  -- created duplicate event rows. Keep the earliest row for each HME event; all
  -- linked rows on the discarded copies are removed by their foreign-key cascades.
  delete from public.schedule_items si
  using (
    select id
    from (
      select id,
             row_number() over (partition by source_note order by created_at, id) as row_number
      from public.schedule_items
      where source_note in (
        'HME 2026 schedule | Flash glucose',
        'HME 2026 schedule | CVRM',
        'HME 2026 schedule | UCL clinical trials'
      )
    ) ranked
    where row_number > 1
  ) duplicate
  where si.id = duplicate.id;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, hme_id from public.schedule_items where source_note like 'HME 2026 schedule | %'
  on conflict do nothing;
end $$;
