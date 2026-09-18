-- Additional high-signal YepBio opportunities within 28 September-23 October 2026.
-- No live deployment is performed by this file; run manually in Supabase SQL Editor.
-- Safe to rerun by title + start time / organisation + institution.
do $$
declare
  yepbio_id uuid;
  admin_id uuid;
begin
  select id into yepbio_id from public.organisations where slug = 'yepbio';
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  if yepbio_id is null then raise exception 'YepBio organisation is missing.'; end if;
  if admin_id is null then raise exception 'No LVCN admin profile exists.'; end if;

  with events (title, description, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, priority, fit, next_action, source_note) as (
    values
      ('Oxford Autumn School in Neuroscience 2026', 'Two-day Oxford neuroscience conference covering brain mechanisms, neurostimulation, functional MRI, neural circuits and clinical neuroscience.', '2026-10-08T09:15:00+01:00'::timestamptz, '2026-10-09T16:15:00+01:00'::timestamptz, 'exact'::public.time_precision, 'Sherrington Building, University of Oxford', 'https://www.neuroscience.ox.ac.uk/about/oxford-autumn-school-in-neuroscience-2026', 'unknown'::public.cost_type, 'Registration and eligibility to verify.', 'strong_option'::public.item_priority, 'Direct academic route into Oxford and KCL neuroscience, including multimodal fMRI and non-invasive stimulation conversations relevant to Parkinson''s mechanisms and biomarker strategy.', 'Review the programme, identify neurodegeneration/imaging speakers and request one or two short meetings before travelling.', 'YepBio UK opportunities | Oxford Autumn School in Neuroscience'),
      ('Oxford NeuroAI Forum: October 2026 session', 'Oxford university forum on computational neuroscience and AI, open to the university community and relevant external research-networking route.', '2026-10-09T15:00:00+01:00'::timestamptz, '2026-10-09T17:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'Sherrington Library, Oxford', 'https://events.ox.ac.uk/events/search?series=Oxford+NeuroAI+Forum', 'free'::public.cost_type, 'Free; status and registration details to confirm.', 'conditional'::public.item_priority, 'Useful for computational neuroscience, multimodal data and AI-enabled biomarker conversations without adding a generic tech event.', 'Attend only if the final speaker/topic is relevant to neurodegeneration, imaging or translational data science.', 'YepBio UK opportunities | Oxford NeuroAI Forum'),
      ('BioEscalator Mini Supplier Show — October 2026', 'Oxford BioEscalator drop-in supplier showcase with life-science equipment, imaging, consumables and technology demonstrations.', '2026-10-13T10:00:00+01:00'::timestamptz, '2026-10-13T15:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'BioEscalator, Old Road Campus, Oxford', 'https://enspire.ox.ac.uk/events/bioescalator-mini-supplier-show-october', 'free'::public.cost_type, 'Free; no registration stated by organiser.', 'conditional'::public.item_priority, 'Low-friction Oxford translational ecosystem touchpoint for assay, imaging, lab-supplier and research-infrastructure conversations.', 'Attend only if paired with a pre-arranged Oxford lab, biomarker or investor meeting.', 'YepBio UK opportunities | Oxford BioEscalator Supplier Show'),
      ('Life Sciences, the NHS and Health Innovation Conference 2026', 'King''s Fund conference on implementing health innovation in NHS services, including diagnostics, AI, genomics, joined-up data and research adoption.', '2026-10-13T08:15:00+01:00'::timestamptz, '2026-10-13T17:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'The King''s Fund, London', 'https://www.kingsfund.org.uk/events/life-sciences', 'paid'::public.cost_type, 'From £110 + VAT; confirm current rate.', 'strong_option'::public.item_priority, 'Relevant for turning a Parkinson''s biomarker proposition into NHS, clinical-research and health-innovation adoption conversations.', 'Prioritise NHS research, diagnostics, data and life-sciences partnership attendees; secure introductions before booking.', 'YepBio UK opportunities | King''s Fund Life Sciences NHS Innovation'),
      ('Cure Parkinson''s Autumn Research Update Meeting 2026', 'Parkinson''s research update focused on neurotrophic factors, clinical-trial opportunities and patient-led discussion.', '2026-10-19T13:30:00+01:00'::timestamptz, '2026-10-19T18:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'Royal Society of Medicine, London', 'https://www.eventbrite.co.uk/e/cure-parkinsons-autumn-research-update-meeting-2026-tickets-1998486251175', 'unknown'::public.cost_type, 'Registration and attendee terms to verify.', 'must_pursue'::public.item_priority, 'The most directly disease-specific addition: a credible route to Parkinson''s researchers, trial-design context, patient involvement and biomarker-relevant relationships.', 'Register promptly; attend with a listening agenda and identify speakers or patient-research contacts for follow-up.', 'YepBio UK opportunities | Cure Parkinson''s Autumn Research Update')
  ), inserted as (
    insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
    select title, description, 'third_party', 'selected_organisations', 'optional', starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, 'proposed', 'to_register', priority, fit, next_action, source_note, admin_id
    from events event
    where not exists (select 1 from public.schedule_items existing where existing.title = event.title and existing.starts_at = event.starts_at)
    returning id
  )
  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, yepbio_id from inserted on conflict do nothing;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select item.id, yepbio_id from public.schedule_items item
  where item.source_note like 'YepBio UK opportunities | %'
    and not exists (select 1 from public.schedule_item_organisations target where target.schedule_item_id = item.id and target.organisation_id = yepbio_id);

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select item.id, yepbio_id, 'undecided', admin_id from public.schedule_items item
  where item.source_note like 'YepBio UK opportunities | %'
  on conflict (schedule_item_id, organisation_id) do nothing;

  with targets (institution_name, category, external_url, startup_visible_note, next_action) as (
    values
      ('Cure Parkinson''s', 'Parkinson''s research / patient involvement', 'https://cureparkinsons.org.uk/', 'Direct Parkinson''s research and patient-involvement relationship relevant to trial design and biomarker adoption.', 'Use the October research update to identify the right research or patient-involvement contact, then request a focused follow-up.'),
      ('The King''s Fund / Health Innovation Network', 'NHS adoption / health innovation', 'https://www.kingsfund.org.uk/events/life-sciences', 'Potential route into NHS adoption, diagnostics, health-innovation and research-implementation conversations.', 'Target one NHS research lead and one diagnostics or health-innovation partnership contact.'),
      ('Oxford Neuroscience', 'Academic neuroscience / imaging', 'https://www.neuroscience.ox.ac.uk/', 'Oxford neuroscience network may provide collaborators in imaging, neural mechanisms and translational research.', 'Use the Autumn School to identify one relevant PI or imaging researcher for a short follow-up.'),
      ('Oxford BioEscalator', 'Life-science ecosystem / suppliers', 'https://enspire.ox.ac.uk/', 'Useful Oxford translational ecosystem contact for lab infrastructure, suppliers and early-stage biotech relationships.', 'Attend the supplier showcase only if paired with a named Oxford research or investor introduction.')
  )
  insert into public.potential_meetings (organisation_id, institution_name, category, status, external_url, startup_visible_note, next_action, created_by)
  select yepbio_id, institution_name, category, 'draft'::public.potential_meeting_status, external_url, startup_visible_note, next_action, admin_id
  from targets target
  where not exists (select 1 from public.potential_meetings existing where existing.organisation_id = yepbio_id and lower(trim(existing.institution_name)) = lower(trim(target.institution_name)));
end $$;
