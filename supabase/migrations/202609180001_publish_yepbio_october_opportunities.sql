-- Publish the three verified October 2026 opportunities researched for YepBio.
-- These are startup-visible schedule events and potential meeting targets, not
-- local planning notes. The migration is safe to apply once and may be rerun.
do $$
declare
  yepbio_id uuid;
  admin_id uuid;
begin
  select id into yepbio_id from public.organisations where slug = 'yepbio';
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;

  if yepbio_id is null then
    raise exception 'YepBio organisation is missing.';
  end if;
  if admin_id is null then
    raise exception 'No LVCN admin profile exists. Sign in once as an LVCN admin, then deploy this migration.';
  end if;

  with events (title, description, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, priority, fit, next_action, source_note) as (
    values
      (
        'Optimum Healthcare Investor Conference 2026',
        'Invitation-only London healthcare investor conference. Best for YepBio''s Series A narrative, international investor positioning and strategic-financing feedback.',
        '2026-10-08T09:00:00+01:00'::timestamptz,
        '2026-10-08T19:15:00+01:00'::timestamptz,
        'exact'::public.time_precision,
        'The King''s Fund, Cavendish Square, London W1G 0AN',
        'https://www.optimumcomms.com/irconference2026/',
        'unknown'::public.cost_type,
        'Invitation-only. Register interest with the organiser.',
        'must_pursue'::public.item_priority,
        'A concentrated investor audience aligned with YepBio''s Series A and cross-border financing goals.',
        'Register interest and request targeted introductions to Novo Holdings and Jefferies attendees.',
        'YepBio October 2026 | Optimum Healthcare Investor Conference'
      ),
      (
        'BIA TechBio UK 2026',
        'UK TechBio conference bringing together biotech, pharma, technology and investment leaders. Relevant to YepBio''s PARIS biomarker strategy and precision-medicine partnerships.',
        '2026-10-13T09:00:00+01:00'::timestamptz,
        '2026-10-13T18:00:00+01:00'::timestamptz,
        'exact'::public.time_precision,
        'Kings Cross, London',
        'https://www.bioindustry.org/events/our-events/techbiouk.html',
        'unknown'::public.cost_type,
        'BIA member-only event. Request member or guest access.',
        'strong_option'::public.item_priority,
        'Direct route to UK precision-medicine, genomics, data and pharma ecosystem contacts.',
        'Request access and pre-book a conversation with the BIA TechBio community.',
        'YepBio October 2026 | BIA TechBio UK'
      ),
      (
        'ELRIG Drug Discovery 2026 - Day 1',
        'Europe''s drug-discovery conference. YepBio should prioritise day one for neuroscience, translational-research and discovery-partner conversations, preserving the 15 October investor-pitch programme.',
        '2026-10-14T08:00:00+01:00'::timestamptz,
        '2026-10-14T19:00:00+01:00'::timestamptz,
        'exact'::public.time_precision,
        'ExCeL London',
        'https://www.elrig.org/portfolio/drug-discovery/',
        'free'::public.cost_type,
        'Free to attend; register and arrange meetings in advance.',
        'strong_option'::public.item_priority,
        'Relevant discovery, neuroscience and translational ecosystem access for YPD-01 and the PARIS biomarker plan.',
        'Register for day one and seek British Neuroscience Association, CRUK and SLAS introductions before arrival.',
        'YepBio October 2026 | ELRIG Drug Discovery Day 1'
      )
  ), inserted as (
    insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
    select title, description, 'third_party', 'selected_organisations', 'recommended', starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, 'proposed', 'to_register', priority, fit, next_action, source_note, admin_id
    from events event
    where not exists (select 1 from public.schedule_items existing where existing.source_note = event.source_note)
    returning id
  )
  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, yepbio_id from inserted
  on conflict do nothing;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select item.id, yepbio_id
  from public.schedule_items item
  where item.source_note like 'YepBio October 2026 | %'
    and not exists (
      select 1 from public.schedule_item_organisations target
      where target.schedule_item_id = item.id and target.organisation_id = yepbio_id
    );

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select item.id, yepbio_id, 'undecided', admin_id
  from public.schedule_items item
  where item.source_note like 'YepBio October 2026 | %'
  on conflict (schedule_item_id, organisation_id) do nothing;

  with meetings (institution_name, category, external_url, startup_visible_note, next_action) as (
    values
      ('Naveed Siddiqi - Novo Holdings', 'Life-sciences investor', 'https://novo.com/', 'Senior Partner in Venture Investments at Novo Holdings. High-value Series A and European life-sciences financing conversation at the Optimum conference.', 'Request a short meeting at Optimum to test YepBio''s financing milestones and European investor fit.'),
      ('Gil Bar-Nahum - Jefferies International', 'Investment banking / biotechnology', 'https://www.jefferies.com/', 'EMEA Head of Biotechnology at Jefferies. Relevant for cross-border financing, strategic-partner readiness and investor-positioning feedback.', 'Request a short Optimum meeting focused on financing path, partnering readiness and future transaction options.'),
      ('Dr Emma Lawrence - BIA TechBio community', 'Precision medicine / industry network', 'https://www.bioindustry.org/policy/technologies/techbio.html', 'BIA lead for genomics, digital, data and AI policy and TechBio community engagement. A useful route into UK precision-medicine and biomarker collaborators.', 'Request a TechBio UK introduction to relevant genomics, data, diagnostics and pharma members.'),
      ('British Neuroscience Association representatives', 'Neuroscience research network', 'https://www.bna.org.uk/', 'Relevant neuroscience community route at ELRIG for translational-research and discovery conversations supporting YPD-01 and the PARIS biomarker strategy.', 'Identify attending representatives and request an introduction before ELRIG day one.')
  )
  insert into public.potential_meetings (organisation_id, institution_name, category, status, external_url, startup_visible_note, next_action, created_by)
  select yepbio_id, institution_name, category, 'draft', external_url, startup_visible_note, next_action, admin_id
  from meetings meeting
  where not exists (
    select 1 from public.potential_meetings existing
    where existing.organisation_id = yepbio_id
      and lower(trim(existing.institution_name)) = lower(trim(meeting.institution_name))
  );
end $$;
