-- Jiro / Dropshot AI expansion: creative AI, advertising, media and investor opportunities.
-- Run manually in Supabase SQL Editor after jiro_pa_yepbio_2026.sql.
-- Safe to rerun: events are keyed by source_note and meetings by institution.
do $$
declare
  jiro_id uuid;
  admin_id uuid;
begin
  select id into jiro_id
  from public.organisations
  where slug in ('jiro', 'jiro-dropshot-ai', 'dropshot-ai')
     or lower(trim(name)) in ('jiro', 'jiro inc.', 'jiro inc', 'dropshot ai')
  order by case when slug = 'jiro' then 0 when lower(trim(name)) = 'jiro' then 1 else 2 end
  limit 1;
  if jiro_id is null then
    insert into public.organisations (name, slug) values ('Jiro', 'jiro') on conflict (slug) do nothing;
    select id into jiro_id from public.organisations where slug = 'jiro';
  end if;
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  if jiro_id is null then raise exception 'Jiro organisation is missing.'; end if;
  if admin_id is null then raise exception 'No LVCN admin profile exists.'; end if;

  with events (title, description, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, priority, fit, next_action, source_note) as (
    values
      ('Creators Emergency Summit 2026', 'Creative-industry summit on generative AI, creator rights, policy, legal questions and ethical technology.', '2026-10-13T09:00:00+01:00'::timestamptz, '2026-10-13T16:30:00+01:00'::timestamptz, 'exact'::public.time_precision, 'Conway Hall, London', 'https://www.dacs.org.uk/news-events/creators-emergency-summit', 'paid'::public.cost_type, 'Confirm ticket and startup terms.', 'must_pursue'::public.item_priority, 'Directly relevant to Dropshot Explorer, rights-cleared assets, likeness protection and the EU AI Act Article 50 compliance narrative.', 'Prepare a short rights-and-watermarking briefing and target creator, legal and policy contacts.', 'Jiro expansion 2026 | Creators Emergency Summit'),
      ('Spotlight Conference 2026', 'Senior marketing conference covering AI, content, brand, search, visibility and marketing leadership.', '2026-10-13T09:00:00+01:00'::timestamptz, '2026-10-13T18:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'London, UK', 'https://www.spotlightconf.com/why-attend', 'paid'::public.cost_type, 'Confirm venue and pass type.', 'strong_option'::public.item_priority, 'A concentrated route to the marketing budget-holders who buy high-frequency, brand-consistent video production.', 'Target CMOs, content operations and brand leads; bring a concise enterprise pilot offer.', 'Jiro expansion 2026 | Spotlight Conference'),
      ('AIMA London 2026 - AI Movie Awards', 'Two-day AI filmmaking event with screenings, panels, workshops and creative-industry networking.', '2026-11-07T10:00:00+00:00'::timestamptz, '2026-11-08T20:00:00+00:00'::timestamptz, 'exact'::public.time_precision, 'IET London: Savoy Place', 'https://www.aimovieawards.org/tickets-london/', 'paid'::public.cost_type, 'Early-bird and industry ticket availability to verify.', 'must_pursue'::public.item_priority, 'High-signal creative showcase for Dropshot''s quality advantage, AI-film workflow and creator/production partnerships.', 'Apply for industry networking access and identify filmmakers or production companies for a European case study.', 'Jiro expansion 2026 | AIMA London'),
      ('AI Creative Summit 2026', 'AI and creativity summit covering applied insight, technical innovation, media and creative production.', '2026-11-11T09:00:00+00:00'::timestamptz, '2026-11-11T18:00:00+00:00'::timestamptz, 'exact'::public.time_precision, 'BFI Southbank, London', 'https://www.aicreativesummit.co.uk/', 'paid'::public.cost_type, 'Confirm startup and demo opportunities.', 'must_pursue'::public.item_priority, 'One of the best direct rooms for generative video, creative technology, production leaders and enterprise buyers.', 'Request a demo or networking slot; lead with finished-output quality and rights-cleared production.', 'Jiro expansion 2026 | AI Creative Summit'),
      ('Event Tech Live London 2026', 'Event and marketing technology event with AI, audience engagement, data and creative-technology sessions.', '2026-11-11T09:00:00+00:00'::timestamptz, '2026-11-12T17:00:00+00:00'::timestamptz, 'exact'::public.time_precision, 'ExCeL London', 'https://agenda.eventtechlive.com/', 'paid'::public.cost_type, 'Verify visitor and exhibitor options.', 'strong_option'::public.item_priority, 'Useful adjacent market for rapid video generation, event content, audience engagement and brand-activation workflows.', 'Target event agencies, large organisers and marketing-technology buyers rather than general attendees.', 'Jiro expansion 2026 | Event Tech Live'),
      ('AI and Games Conference 2026', 'Applied AI conference for games, interactive media and content-production teams.', '2026-11-10T09:00:00+00:00'::timestamptz, '2026-11-11T17:00:00+00:00'::timestamptz, 'exact'::public.time_precision, 'HERE EAST, Olympic Park, London', 'https://www.aiandgamesconference.com/', 'paid'::public.cost_type, 'Confirm pass and partner access.', 'conditional'::public.item_priority, 'Adjacent but credible route to game studios, interactive-media companies and technical creative teams that need scalable visual content.', 'Attend only if a game, virtual-production or interactive-media pilot can be pre-arranged.', 'Jiro expansion 2026 | AI and Games Conference'),
      ('AI in Business Conference London 2026', 'Enterprise AI event for senior technology, strategy and transformation decision-makers.', '2026-11-19T08:15:00+00:00'::timestamptz, '2026-11-19T17:15:00+00:00'::timestamptz, 'exact'::public.time_precision, 'London, UK - venue TBC', 'https://www.aibusinessconference.co.uk/', 'paid'::public.cost_type, 'Venue and ticket details to verify.', 'strong_option'::public.item_priority, 'Potential enterprise buyer and partner room for positioning Dropshot as a governed production workflow, not a novelty generator.', 'Target enterprise marketing, procurement, legal and AI-governance attendees; use the compliance-ready narrative.', 'Jiro expansion 2026 | AI in Business Conference'),
      ('London Life Sciences Week - creative and AI partnership track', 'London-wide week of life-sciences week with investor, corporate and innovation networking.', '2026-11-15T09:00:00+00:00'::timestamptz, '2026-11-20T18:00:00+00:00'::timestamptz, 'all_day'::public.time_precision, 'Multiple London venues', 'https://lifesciencesweek.london/', 'unknown'::public.cost_type, 'Individual event registration varies.', 'conditional'::public.item_priority, 'Not a core market, but potentially useful for regulated-content, pharma education and healthcare-marketing partnerships where rights and review workflows matter.', 'Attend only if a named pharma, agency or healthcare-content meeting is secured first.', 'Jiro expansion 2026 | London Life Sciences Week')
  ), inserted as (
    insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
    select title, description, 'third_party', 'selected_organisations', 'optional', starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, 'proposed', 'to_register', priority, fit, next_action, source_note, admin_id
    from events event
    where not exists (select 1 from public.schedule_items existing where existing.source_note = event.source_note)
    returning id
  )
  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, jiro_id from inserted on conflict do nothing;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select item.id, jiro_id from public.schedule_items item
  where item.source_note like 'Jiro expansion 2026 | %'
    and not exists (select 1 from public.schedule_item_organisations target where target.schedule_item_id = item.id and target.organisation_id = jiro_id);

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select item.id, jiro_id, 'undecided', admin_id from public.schedule_items item
  where item.source_note like 'Jiro expansion 2026 | %'
  on conflict (schedule_item_id, organisation_id) do nothing;

  with targets (institution_name, category, external_url, startup_visible_note, next_action) as (
    values
      ('WPP', 'Advertising agency / strategic partner', 'https://www.wpp.com/', 'Global agency group with major UK and European brand relationships; potential enterprise pilot, channel and production-workflow partner.', 'Request an introduction to a UK creative-technology or AI production lead with a tightly scoped pilot proposal.'),
      ('Dentsu Creative', 'Advertising agency / strategic partner', 'https://www.dentsucreative.com/', 'Agency network with brand, commerce and production operations that could test repeatable, rights-cleared AI video workflows.', 'Target UK or Netherlands creative-technology leadership and propose a single client-safe pilot.'),
      ('Publicis Groupe', 'Advertising agency / strategic partner', 'https://www.publicisgroupe.com/', 'Large agency and commerce ecosystem; relevant for enterprise production scale, brand governance and multi-market content.', 'Identify a production, commerce or Marcel/AI innovation contact; avoid a generic platform pitch.'),
      ('Havas', 'Advertising agency / strategic partner', 'https://www.havas.com/', 'European agency network with creative and media operations suited to a brand-safe generative-video workflow.', 'Request a targeted introduction to UK or Netherlands innovation and production operations.'),
      ('DEPT', 'Digital agency / enterprise pilot', 'https://www.deptagency.com/', 'Digital agency with commerce and technology delivery; a plausible first European pilot and channel partner.', 'Propose a short e-commerce video pilot with measurable production-time and approval-risk outcomes.'),
      ('Clearcast', 'Advertising clearance / compliance', 'https://clearcast.co.uk/', 'UK advertising-clearance expertise is directly relevant to AI-generated commercial content and evidence of rights/likeness controls.', 'Request an exploratory discussion on clearance expectations and Dropshot Explorer safeguards.'),
      ('Advertising Standards Authority', 'Advertising policy / compliance', 'https://www.asa.org.uk/', 'Useful policy and claims-compliance perspective for synthetic advertising content and consumer-facing disclosures.', 'Use public guidance and request the appropriate non-binding advice route; do not imply endorsement.'),
      ('ICO Innovation Advice', 'Data protection / AI compliance', 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/innovation-advice/', 'Relevant UK route for data-processing, training-data, likeness and privacy questions around a rights-cleared AI content workflow.', 'Prepare a concise data-flow, asset-rights and retention briefing before seeking advice.'),
      ('Balderton Capital', 'Investor / European technology', 'https://www.balderton.com/', 'European technology investor potentially relevant to a USD 5-10M Series B and enterprise AI expansion.', 'Request a targeted introduction after packaging European pilot evidence and net retention metrics.'),
      ('Atomico', 'Investor / European technology', 'https://atomico.com/', 'Large European technology investor; potentially relevant if Dropshot demonstrates repeatable international enterprise revenue.', 'Qualify stage and cheque fit before requesting a partner-level introduction.'),
      ('Index Ventures', 'Investor / AI and software', 'https://www.indexventures.com/', 'European software and AI investor with potential interest in a global, high-growth enterprise content platform.', 'Lead with 220k+ MAU, B2B conversion, rights-cleared moat and Series B milestones.'),
      ('LocalGlobe', 'Investor / UK technology', 'https://www.localglobe.vc/', 'UK technology investor and ecosystem connector; useful for early European customer and founder introductions even if the round is Series B.', 'Request a fit check and introductions to UK AI, agency or commerce operators.'),
      ('Octopus Ventures', 'Investor / AI and consumer technology', 'https://octopusventures.com/', 'UK investor with consumer and technology network that may connect Dropshot''s B2C scale to enterprise monetisation.', 'Qualify current AI/creative-tech appetite and request a targeted conversation.'),
      ('Dawn Capital', 'Investor / enterprise software', 'https://www.dawncapital.com/', 'Enterprise software investor potentially relevant to converting a high-growth consumer engine into B2B recurring revenue.', 'Test fit around workflow software, governance and enterprise expansion rather than media novelty.'),
      ('Sifted', 'European startup ecosystem / media', 'https://sifted.eu/', 'European startup-media and ecosystem access can support awareness and investor discovery during the first Western Europe expansion.', 'Request an editorial or ecosystem introduction only after a concrete European pilot story exists.')
  )
  insert into public.potential_meetings (organisation_id, institution_name, category, status, external_url, startup_visible_note, next_action, created_by)
  select jiro_id, institution_name, category, 'draft'::public.potential_meeting_status, external_url, startup_visible_note, next_action, admin_id
  from targets target
  where not exists (select 1 from public.potential_meetings existing where existing.organisation_id = jiro_id and lower(trim(existing.institution_name)) = lower(trim(target.institution_name)));
end $$;
