-- HME Square expansion: additional UK schedule and high-signal relationships.
-- Run manually in Supabase SQL Editor after hme_square_2026.sql.
-- Safe to rerun: event rows are keyed by source_note and meetings by institution.
do $$
declare
  hme_id uuid;
  admin_id uuid;
begin
  select id into hme_id from public.organisations where slug = 'hme-square';
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  if hme_id is null then raise exception 'HME Square organisation is missing.'; end if;
  if admin_id is null then raise exception 'No LVCN admin profile exists.'; end if;

  with events (title, description, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, priority, fit, next_action, source_note) as (
    values
      ('HETT 2026', 'Health Tech and Transformation Summit with NHS innovation, procurement, digital-health and adoption stakeholders.', '2026-09-29T09:00:00+01:00'::timestamptz, '2026-09-30T17:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'ExCeL London', 'https://www.hettshow.co.uk/', 'paid'::public.cost_type, 'Verify startup and innovation-pass eligibility.', 'must_pursue'::public.item_priority, 'Direct NHS Innovation Service access and a credible route to NHS adoption conversations for GlucoSOUND.', 'Visit the NHS Innovation Service stand and prepare a one-page NHS adoption and wellness-pilot brief.', 'HME expansion 2026 | HETT'),
      ('CPI Innovation in MedTech and Diagnostics Conference', 'Conference on medtech and diagnostics innovation, translation, regulation and commercialisation.', '2026-10-06T09:00:00+01:00'::timestamptz, '2026-10-07T17:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'Prince Philip House, London', 'https://www.uk-cpi.com/events', 'paid'::public.cost_type, 'Confirm startup rate and programme access.', 'strong_option'::public.item_priority, 'Useful cross-over between device validation, diagnostics, clinical evidence, regulatory strategy and medtech investors.', 'Prioritise sessions on diagnostics, clinical evidence and market access; request two targeted introductions.', 'HME expansion 2026 | CPI MedTech Diagnostics'),
      ('Optimum 18th Annual Healthcare Investor Conference', 'Invitation-led healthcare investor conference with specialist life-sciences capital and healthcare company leaders.', '2026-10-08T09:00:00+01:00'::timestamptz, '2026-10-08T18:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'The King''s Fund, London', 'https://www.optimumcomms.com/irconference2026/', 'unknown'::public.cost_type, 'Invitation-only; request access.', 'must_pursue'::public.item_priority, 'High-value investor route for HME''s USD 2-5M Series A and clinical-to-commercial transition.', 'Request an invitation with the GlucoSOUND clinical metrics, UK launch plan and Series A milestones.', 'HME expansion 2026 | Optimum Healthcare Investor Conference'),
      ('The Pharmacy Show 2026', 'The UK''s dedicated community and primary-care pharmacy trade show and education conference.', '2026-10-11T09:00:00+01:00'::timestamptz, '2026-10-12T16:30:00+01:00'::timestamptz, 'exact'::public.time_precision, 'NEC Birmingham', 'https://www.thepharmacyshow.co.uk/', 'free'::public.cost_type, 'Free visitor registration; verify exhibitor and demo options.', 'must_pursue'::public.item_priority, 'Direct access to pharmacy owners, primary-care professionals, service innovators and potential UK distribution partners.', 'Book a visitor pass and prepare a pharmacy-specific demo focused on needle-free monitoring and patient adherence.', 'HME expansion 2026 | Pharmacy Show'),
      ('Royal College of Pharmacy Annual Conference 2026', 'UK pharmacy conference focused on collaboration, innovation and impact across pharmacy practice and healthcare.', '2026-11-06T09:00:00+00:00'::timestamptz, '2026-11-06T18:00:00+00:00'::timestamptz, 'exact'::public.time_precision, '133 Houndsditch, London', 'https://www.rcpharm.org/events/rcpharm-annual-conference-2026/', 'paid'::public.cost_type, 'Confirm attendance and exhibitor terms.', 'strong_option'::public.item_priority, 'Good route to pharmacists and pharmacy-science stakeholders who can assess a community-pharmacy and patient-support pathway.', 'Ask for an innovation or digital-health introduction; test the UK pharmacy value proposition.', 'HME expansion 2026 | Royal College of Pharmacy'),
      ('ABHI UK HealthTech Conference 2026', 'Two-day healthtech conference covering regulation, NHS access, procurement, investment and commercial adoption.', '2026-11-09T09:30:00+00:00'::timestamptz, '2026-11-10T17:00:00+00:00'::timestamptz, 'exact'::public.time_precision, 'Cavendish Conference Centre, London', 'https://www.abhi.org.uk/events/abhi-events/the-abhi-uk-healthtech-conference-2026/', 'paid'::public.cost_type, 'Confirm membership and startup pricing.', 'must_pursue'::public.item_priority, 'Directly maps to HME''s UK market-access, investment, regulatory and adoption objectives.', 'Prioritise NICE/NHS access and investment sessions; request meetings with market-access and commercial leads.', 'HME expansion 2026 | ABHI UK HealthTech Conference'),
      ('London Life Sciences Week 2026', 'London-wide week of showcases, investor meetings and life-sciences networking.', '2026-11-15T09:00:00+00:00'::timestamptz, '2026-11-20T18:00:00+00:00'::timestamptz, 'all_day'::public.time_precision, 'Multiple London venues', 'https://lifesciencesweek.london/', 'unknown'::public.cost_type, 'Individual event registration varies.', 'must_pursue'::public.item_priority, 'Concentrated access to healthtech VCs, strategic partners, NHS innovators and clinical leaders for a Series A and EU market-entry plan.', 'Build a meeting plan around investor, medtech and NHS adoption sessions; request introductions before the week.', 'HME expansion 2026 | London Life Sciences Week'),
      ('GIANT Health London 2026', 'Large NHS innovation and health-technology festival with investors, clinicians, buyers and healthtech companies.', '2026-12-07T09:00:00+00:00'::timestamptz, '2026-12-08T17:00:00+00:00'::timestamptz, 'exact'::public.time_precision, 'Business Design Centre, London', 'https://www.giant.health/', 'paid'::public.cost_type, 'Confirm startup ticket and pitch/showcase options.', 'strong_option'::public.item_priority, 'Useful end-of-programme platform to turn SVC introductions into NHS, employer-wellness and investor follow-ups.', 'Apply for an appropriate startup showcase or arrange meetings with NHS buyers and healthtech investors.', 'HME expansion 2026 | GIANT Health')
  ), inserted as (
    insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
    select title, description, 'third_party', 'selected_organisations', 'recommended', starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, 'proposed', 'to_register', priority, fit, next_action, source_note, admin_id
    from events event
    where not exists (select 1 from public.schedule_items existing where existing.source_note = event.source_note)
    returning id
  )
  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, hme_id from inserted on conflict do nothing;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select item.id, hme_id from public.schedule_items item
  where item.source_note like 'HME expansion 2026 | %'
    and not exists (select 1 from public.schedule_item_organisations target where target.schedule_item_id = item.id and target.organisation_id = hme_id);

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select item.id, hme_id, 'undecided', admin_id from public.schedule_items item
  where item.source_note like 'HME expansion 2026 | %'
  on conflict (schedule_item_id, organisation_id) do nothing;

  with targets (institution_name, category, external_url, startup_visible_note, next_action) as (
    values
      ('NHS Innovation Service', 'NHS adoption / innovation', 'https://innovation.nhs.uk/', 'Practical route into NHS innovation support, assessment and adoption-readiness conversations for a novel glucose-monitoring device.', 'Create an NHS Innovation Record and use HETT to request the appropriate support partner.'),
      ('DigitalHealth.London Accelerator', 'NHS adoption / digital health', 'https://digitalhealth.london/accelerator', 'Relevant London network for NHS pathway design, pilot readiness and digital-health introductions.', 'Ask whether the current cohort or alumni network can support a device-led diabetes pilot.'),
      ('BSI Netherlands', 'Regulatory / Notified Body', 'https://www.bsigroup.com/en-NL/medical-devices/', 'Named HME target for CE-MDR preparation and a potential technical gap-analysis relationship.', 'Request an initial Class IIb scope and evidence-gap conversation; do not present this as an existing engagement.'),
      ('TÜV SÜD', 'Regulatory / Notified Body', 'https://www.tuvsud.com/en/industries/healthcare-and-medical-devices', 'Alternative notified-body and regulatory route for HME''s CE-MDR preparation.', 'Compare scope, lead time and evidence expectations with BSI NL.'),
      ('Forbion', 'Investor / Medtech', 'https://forbion.com/', 'European life-sciences investor explicitly relevant to HME''s Series A and medical-device evidence journey.', 'Request a targeted introduction with MARD 9.9%, pivotal-trial status and UK/EU launch milestones.'),
      ('Thuja Capital', 'Investor / Healthtech', 'https://thujacapital.com/', 'HME names Thuja as a priority EU medtech target; potentially relevant for an early institutional Series A conversation.', 'Confirm current device and digital-health mandate and request a focused partner introduction.'),
      ('Nina Capital', 'Investor / Digital health', 'https://www.ninacapital.com/', 'Spanish digital-health investor aligned to HME''s Spain wellness and clinical-partner objective.', 'Request a Spanish market-entry and Series A fit discussion.'),
      ('Johnson & Johnson Innovation / JJDC', 'Strategic / Medtech', 'https://jnjinnovation.com/', 'Potential strategic route for device, clinical, distribution and diabetes-care ecosystem conversations.', 'Ask for the appropriate diabetes-device or external-innovation contact; coordinate with existing NDA discussions.'),
      ('Community Pharmacy England', 'Pharmacy / Distribution', 'https://cpe.org.uk/', 'Useful pharmacy-sector perspective for a GlucoSOUND community-pharmacy distribution and patient-support model.', 'Request an innovation or community-pharmacy pathway introduction before committing to a distribution model.'),
      ('NHS England Diabetes Programme', 'NHS / Diabetes pathway', 'https://www.england.nhs.uk/diabetes/', 'Policy and pathway context for future NHS evidence, adoption and reimbursement discussions.', 'Map the relevant diabetes and innovation stakeholders; keep the conversation exploratory until UK evidence is ready.')
  )
  insert into public.potential_meetings (organisation_id, institution_name, category, status, external_url, startup_visible_note, next_action, created_by)
  select hme_id, institution_name, category, 'draft'::public.potential_meeting_status, external_url, startup_visible_note, next_action, admin_id
  from targets target
  where not exists (select 1 from public.potential_meetings existing where existing.organisation_id = hme_id and lower(trim(existing.institution_name)) = lower(trim(target.institution_name)));
end $$;
