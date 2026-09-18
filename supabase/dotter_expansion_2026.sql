-- Dotter expansion: high-signal UK events and pre-IPO medtech investor targets.
-- Run manually in Supabase SQL Editor after dotter_schedule_2026.sql.
-- Safe to rerun: records are keyed by source_note / organisation + institution.
do $$
declare
  dotter_id uuid;
  admin_id uuid;
begin
  select id into dotter_id from public.organisations where slug = 'dotter';
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  if dotter_id is null then raise exception 'Dotter organisation is missing.'; end if;
  if admin_id is null then raise exception 'No LVCN admin profile exists.'; end if;

  with events (title, description, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, priority, fit, next_action, source_note) as (
    values
      ('Optimum 18th Annual Healthcare Investor Conference', 'Invitation-led healthcare and life-sciences investor conference bringing together specialist capital and European healthcare companies.', '2026-10-08T09:00:00+01:00'::timestamptz, '2026-10-08T18:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'The King''s Fund, Cavendish Square, London', 'https://www.optimumcomms.com/irconference2026/', 'unknown'::public.cost_type, 'Invitation-only; request access and confirm delegate criteria.', 'must_pursue'::public.item_priority, 'Best direct investor-networking fit in October for a cardiovascular medtech company preparing a USD 10-20M bridge/pre-IPO round.', 'Request an invitation with a concise Phosline and Benetis investor brief; ask for 3 targeted introductions.', 'Dotter expansion 2026 | Optimum Healthcare Investor Conference'),
      ('CVRM Professional Care 2026', 'UK cardiovascular, renal and metabolic conference and exhibition for clinicians, NHS leaders and medtech participants.', '2026-10-20T09:00:00+01:00'::timestamptz, '2026-10-21T17:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'Olympia London', 'https://pccsuk.org/events/1036/cvrm_professional_care_2026', 'unknown'::public.cost_type, 'Registration and professional eligibility to verify.', 'strong_option'::public.item_priority, 'High-density cardiovascular and NHS stakeholder setting for clinical validation, adoption and interventional-cardiology conversations.', 'Confirm eligibility; prioritise cath-lab, NHS innovation and medtech exhibitors over general sessions.', 'Dotter expansion 2026 | CVRM Professional Care'),
      ('BSI Medical Technology Conference - Regulation & Innovation', 'Medical-device regulation, standards, compliance and market-access conference.', '2026-11-09T09:00:00+00:00'::timestamptz, '2026-11-09T16:30:00+00:00'::timestamptz, 'exact'::public.time_precision, 'Royal Society of Medicine, London', 'https://pages.bsigroup.com/BSI-healthcare-conference-2026', 'paid'::public.cost_type, 'Confirm current registration fee.', 'strong_option'::public.item_priority, 'Useful for UKCA/MDR planning, quality-system questions and the evidence package for Phosline and Benetis Lifetime.', 'Send a focused question list to BSI contacts and identify one regulatory or standards follow-up.', 'Dotter expansion 2026 | BSI Medical Technology Conference'),
      ('London Life Sciences Week 2026', 'London-wide week of life-sciences showcases, investor meetings and ecosystem networking.', '2026-11-15T09:00:00+00:00'::timestamptz, '2026-11-20T18:00:00+00:00'::timestamptz, 'all_day'::public.time_precision, 'Multiple London venues', 'https://lifesciencesweek.london/', 'unknown'::public.cost_type, 'Individual event registration varies.', 'must_pursue'::public.item_priority, 'The highest-value networking window for Dotter: investors, medtech strategics, NHS innovation and clinical partners are concentrated in one week.', 'Build a five-day meeting plan around the LSX and Jefferies anchor events; ask LVCN for targeted introductions.', 'Dotter expansion 2026 | London Life Sciences Week'),
      ('LSX Investival Showcase London', 'Life-science partnering and investment conference with one-to-one partnering facilities.', '2026-11-16T09:00:00+00:00'::timestamptz, '2026-11-16T18:00:00+00:00'::timestamptz, 'exact'::public.time_precision, 'London, UK', 'https://informaconnect.com/investival-showcase/', 'paid'::public.cost_type, 'Paid; verify startup and partnering access.', 'must_pursue'::public.item_priority, 'Direct capital-and-partnering format is well matched to a pre-IPO bridge, medtech licensing and European distribution objectives.', 'Prepare a 10-slide investor version and request meetings with specialist medtech funds before the partnering calendar fills.', 'Dotter expansion 2026 | LSX Investival Showcase'),
      ('Jefferies Global Healthcare Conference', 'Major healthcare investment conference with institutional investor meetings across biotech, medtech and healthcare services.', '2026-11-16T09:00:00+00:00'::timestamptz, '2026-11-19T18:00:00+00:00'::timestamptz, 'all_day'::public.time_precision, 'The Waldorf Hilton, London', 'https://www.jefferies.com/about/conferences-events/global-healthcare-conference-london/', 'unknown'::public.cost_type, 'Access is selective; seek an investor or conference introduction.', 'must_pursue'::public.item_priority, 'Strongest potential fit for crossover and institutional healthcare capital, strategic medtech conversations and a pre-IPO financing narrative.', 'Ask for access through an existing investor, adviser or LVCN introduction; target funds with medtech and late-stage healthcare mandates.', 'Dotter expansion 2026 | Jefferies Global Healthcare Conference')
  ), inserted as (
    insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
    select title, description, 'third_party', 'selected_organisations', 'recommended', starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, 'proposed', 'to_register', priority, fit, next_action, source_note, admin_id
    from events event
    where not exists (select 1 from public.schedule_items existing where existing.source_note = event.source_note)
    returning id
  )
  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, dotter_id from inserted on conflict do nothing;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select item.id, dotter_id from public.schedule_items item
  where item.source_note like 'Dotter expansion 2026 | %'
    and not exists (select 1 from public.schedule_item_organisations target where target.schedule_item_id = item.id and target.organisation_id = dotter_id);

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select item.id, dotter_id, 'undecided', admin_id from public.schedule_items item
  where item.source_note like 'Dotter expansion 2026 | %'
  on conflict (schedule_item_id, organisation_id) do nothing;

  with targets (institution_name, category, external_url, startup_visible_note, next_action) as (
    values
      ('Gilde Healthcare', 'VC / Medtech / Healthcare', 'https://gildehealthcare.com/', 'Specialist healthcare investor with medtech experience; a strong fit for Dotter''s cardiovascular device, clinical evidence and European commercialisation plan.', 'Request a warm introduction with the pre-IPO bridge narrative and current clinical milestones.'),
      ('Forbion', 'VC / Life sciences / Medtech', 'https://www.forbion.com/', 'European life-sciences investor with a relevant medical-device and clinical-development remit for a capital-intensive scale-up.', 'Check current medtech mandate and seek an introduction through the LSX or London Life Sciences Week network.'),
      ('EQT Life Sciences', 'VC / Growth healthcare', 'https://www.eqtgroup.com/about-us/our-businesses/eqt-life-sciences/', 'Large healthcare investor that may be relevant as Dotter moves from clinical validation toward multinational trials and commercial scale.', 'Qualify minimum cheque size and stage fit before requesting a partner-level introduction.'),
      ('Panakes Partners', 'VC / Medtech', 'https://www.panakes.it/', 'Medtech-focused European investor with a natural interest in device innovation, clinical adoption and international market access.', 'Prepare a device-specific one-pager covering Phosline, Benetis Lifetime and the regulatory path.'),
      ('MTIP', 'VC / Digital health and medtech', 'https://www.mtip.ch/', 'European healthcare technology investor potentially relevant to Benetis Lifetime''s imaging and AI-enabled clinical decision-support platform.', 'Lead with Benetis Lifetime and clarify how the imaging platform and Phosline create a combined investment case.'),
      ('Gimv Health & Care', 'VC / Growth medtech', 'https://www.gimv.com/en/health-care', 'European growth investor with health and care exposure; potentially relevant for manufacturing scale-up, distribution and later-stage capital.', 'Request a fit check for a USD 10-20M bridge and identify the relevant health-care investment partner.')
  )
  insert into public.potential_meetings (organisation_id, institution_name, category, status, external_url, startup_visible_note, next_action, created_by)
  select dotter_id, institution_name, category, 'draft'::public.potential_meeting_status, external_url, startup_visible_note, next_action, admin_id
  from targets target
  where not exists (select 1 from public.potential_meetings existing where existing.organisation_id = dotter_id and lower(trim(existing.institution_name)) = lower(trim(target.institution_name)));
end $$;
