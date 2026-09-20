-- Additional verified London opportunities for Dotter, 28 September–23 October 2026.
-- Safe to rerun: each record is guarded by its source_note.
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
      ('CPI Innovation in MedTech and Diagnostics Conference – London 2026',
       'Two-day medtech and diagnostics conference covering medical devices, diagnostics, AI, chronic care, NHS innovation and routes from research to impact.',
       '2026-10-06T09:00:00+01:00'::timestamptz, '2026-10-07T17:00:00+01:00'::timestamptz, 'exact'::public.time_precision,
       'Prince Philip House, London', 'https://www.uk-cpi.com/events', 'paid'::public.cost_type,
       'Confirm the current delegate rate and startup access.', 'must_pursue'::public.item_priority,
       'High-signal fit for Dotter''s cardiovascular device, imaging, diagnostics and clinical-commercialisation work, with medtech, NHS and investor audiences.',
       'Review the agenda and request targeted meetings with cardiovascular-device, diagnostics, NHS and regulatory contacts.',
       'Dotter 2026 schedule | CPI MedTech Diagnostics'),
      ('The Bioengineering Lecture 2026',
       'Imperial College London''s flagship Bioengineering lecture, held on the same day as the White City research showcase.',
       '2026-10-12T17:30:00+01:00'::timestamptz, '2026-10-12T18:30:00+01:00'::timestamptz, 'exact'::public.time_precision,
       'Molecular Sciences Research Hub, White City Campus, London', 'https://www.imperial.ac.uk/bioengineering/whats-on/events/', 'free'::public.cost_type,
       'Free; registration required. Confirm whether external startup attendance remains available.', 'strong_option'::public.item_priority,
       'Useful additional access to Imperial bioengineering researchers and potential technical, imaging and cardiovascular-device collaborators after the afternoon showcase.',
       'Register if external places are available and attend alongside the existing Imperial Bioengineering Research Showcase booking.',
       'Dotter 2026 schedule | Imperial Bioengineering Lecture'),
      ('Reframing Precision Medicine: Innovation to Implementation',
       'Nature conference on translating precision medicine, diagnostics, AI and advanced data into real-world clinical practice and health-system adoption.',
       '2026-10-13T09:00:00+01:00'::timestamptz, '2026-10-15T17:00:00+01:00'::timestamptz, 'all_day'::public.time_precision,
       'The Royal Institution, London', 'https://precision-medicine.conferences.nature.com/attend', 'paid'::public.cost_type,
       'Paid registration; verify current delegate options and the most relevant day.', 'strong_option'::public.item_priority,
       'Relevant to Dotter''s diagnostic evidence, AI-assisted imaging, clinical implementation and investor/health-system narrative.',
       'Review the agenda before booking; prioritise diagnostics, AI, clinical implementation and medical-device sessions.',
       'Dotter 2026 schedule | Nature Precision Medicine'),
      ('Imperial CATO Masterclass: AI for Healthcare',
       'Imperial Academic Health Science Centre masterclass on AI in diagnostics, data-driven patient care and responsible clinical adoption.',
       '2026-10-12T16:00:00+01:00'::timestamptz, '2026-10-12T17:30:00+01:00'::timestamptz, 'exact'::public.time_precision,
       'Online', 'https://www.imperial.ac.uk/medicine/study/clinical-academic-training-office/events/', 'free'::public.cost_type,
       'Free/registration details to verify; audience may be limited to Imperial AHSC and clinical-academic participants.', 'conditional'::public.item_priority,
       'Potentially useful for Dotter''s AI-assisted diagnostics and clinical-adoption strategy, but lower priority because it is online and access may be restricted.',
       'Confirm eligibility before adding to the founder''s attendance plan.',
       'Dotter 2026 schedule | Imperial CATO AI Healthcare')
  ), inserted as (
    insert into public.schedule_items
      (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
    select title, description, 'third_party', 'selected_organisations', 'recommended', starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, 'proposed', 'to_register', priority, fit, next_action, source_note, admin_id
    from events event
    where not exists (select 1 from public.schedule_items existing where existing.source_note = event.source_note)
    returning id
  )
  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select inserted.id, dotter_id from inserted
  on conflict do nothing;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select item.id, dotter_id
  from public.schedule_items item
  where item.source_note like 'Dotter 2026 schedule | %'
    and not exists (
      select 1 from public.schedule_item_organisations target
      where target.schedule_item_id = item.id and target.organisation_id = dotter_id
    )
  on conflict do nothing;

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select item.id, dotter_id, 'undecided', admin_id
  from public.schedule_items item
  where item.source_note like 'Dotter 2026 schedule | %'
    and not exists (
      select 1 from public.event_responses response
      where response.schedule_item_id = item.id and response.organisation_id = dotter_id
    )
  on conflict do nothing;
end $$;
