-- Dotter's confirmed schedule and high-value Potential Biz Meets.
-- Run after migrations 202609170004, 202609170005 and 202609170006.
do $$
declare
  admin_id uuid;
  dotter_id uuid;
begin
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  if admin_id is null then
    select au.id into admin_id
    from auth.users au
    join public.allowed_invites ai on lower(ai.email) = lower(au.email)
    where ai.role = 'lvnc_admin'
    order by au.created_at
    limit 1;
  end if;
  insert into public.organisations (name, slug)
  values ('Dotter', 'dotter')
  on conflict (slug) do nothing;
  select id into dotter_id from public.organisations where slug = 'dotter';
  if admin_id is null then
    raise exception 'No signed-in LVCN admin user was found. Sign in once as an LVCN admin, then rerun this file.';
  end if;

  insert into public.schedule_items
    (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
  values
    ('HETT 2026', 'Health Tech & Transformation Summit. Relevant NHS, clinical-procurement and health-system introduction opportunity for Dotter.', 'third_party', 'selected_organisations', 'recommended', '2026-09-30T00:00:00+01:00', '2026-10-01T00:00:00+01:00', 'all_day', 'ExCeL London', 'https://www.hettshow.co.uk/', 'paid', 'Ticket price: £1,499 (verify registration category before purchase).', 'proposed', 'to_register', 'strong_option', 'NHS market access, clinical procurement and digital-health ecosystem.', 'Confirm delegate pass and identify NHS procurement introductions.', 'Dotter 2026 schedule | HETT', admin_id),
    ('Imperial Bioengineering Research Showcase 2026', 'Poster exhibition and talks at Imperial. Strong research-partner lead generation for imaging, bioengineering and cardiovascular-device validation.', 'third_party', 'selected_organisations', 'recommended', '2026-10-12T11:00:00+01:00', '2026-10-12T14:00:00+01:00', 'exact', 'The Arena, Scale Space, White City Campus, London', 'https://www.imperial.ac.uk/events/212872/bioengineering-research-showcase-2026/', 'free', 'Free; registration required in advance.', 'proposed', 'to_register', 'must_pursue', 'Direct access to Imperial bioengineering researchers and potential technical/clinical collaborators.', 'Register and request introductions relevant to OCT, intravascular imaging and cardiovascular devices.', 'Dotter 2026 schedule | Imperial Bioengineering Showcase', admin_id),
    ('UCL MRC Centre of Research Excellence in Clinical Trial Innovation Launch Symposium', 'Clinical-trial innovation symposium in partnership with NIHR. Relevant to evidence-generation, trial design and UK clinical-study pathways.', 'third_party', 'selected_organisations', 'recommended', '2026-10-13T00:00:00+01:00', '2026-10-14T00:00:00+01:00', 'all_day', 'British Library, 96 Euston Road, London NW1 2DB', 'https://onlinestore.ucl.ac.uk/conferences-and-events/faculty-of-population-health-sciences-c09/institute-of-clinical-trials-and-methodology-d65/d65-mrc-core-launch-symposium-13-october-2026', 'paid', '£500; booking closes 8 October 2026.', 'proposed', 'approval_required', 'strong_option', 'Clinical-trial innovation and NIHR partnership access.', 'Obtain budget approval before booking; prioritise clinical-trial and medtech evidence contacts.', 'Dotter 2026 schedule | UCL clinical trials symposium', admin_id),
    ('UCL TechSocial: FLIP for collaborative AI in healthcare', 'NHS federated-learning platform session. Relevant to Dotter''s AI-assisted FLIm-OCT diagnostics and multi-site clinical-data strategy.', 'third_party', 'selected_organisations', 'optional', '2026-10-20T16:00:00+01:00', '2026-10-20T18:00:00+01:00', 'exact', '90 High Holborn, London WC1V 6LJ', 'https://www.ucl.ac.uk/research-innovation/events/2026/oct/techsocial-series-october-2026', 'free', 'Free; book a place.', 'proposed', 'to_register', 'strong_option', 'NHS data collaboration and diagnostic-AI validation pathway.', 'Register and approach London AI Centre for Value-Based Healthcare contacts.', 'Dotter 2026 schedule | UCL FLIP', admin_id)
  on conflict do nothing;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, dotter_id from public.schedule_items where source_note like 'Dotter 2026 schedule | %'
  on conflict do nothing;

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select id, dotter_id, 'undecided', admin_id from public.schedule_items where source_note like 'Dotter 2026 schedule | %'
  on conflict do nothing;

  insert into public.schedule_items
    (title, item_type, visibility_scope, attendance_rule, time_precision, cost_type, status, booking_status, priority, meeting_category, meeting_status, contact_name, contact_email, meeting_note, next_action, source_note, created_by)
  values
    ('MedTech Investor (Private Equity)', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'must_pursue', 'Investors', 'Contacted', null, null, 'Target a specialist medical-device investor with coronary-intervention, imaging or evidence-generation experience.', 'Identify named investor and request introduction.', 'Dotter 2026 meet | MedTech Investor PE', admin_id),
    ('Former NHS medical director (NHS London Procurement Partnership)', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'must_pursue', 'NHS / Clinical procurement', 'Contacted', null, null, 'Strategic route-to-market and procurement perspective for coronary intervention and diagnostics.', 'Request introduction via LVCN.', 'Dotter 2026 meet | NHS Procurement', admin_id),
    ('Lee Joseph', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'NHS / Clinical procurement', 'Contacted', 'Lee Joseph', 'lee.joseph4@nhs.net', 'Known contact. Explore NHS clinical/procurement perspective and relevant referrals.', 'LVCN to arrange meeting.', 'Dotter 2026 meet | Lee Joseph', admin_id),
    ('Anna Hawksley', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'NHS / Clinical procurement', 'Contacted', 'Anna Hawksley', 'anna.hawksley1@nhs.net', 'Known contact. Explore NHS access, clinical partners and procurement pathway.', 'LVCN to arrange meeting.', 'Dotter 2026 meet | Anna Hawksley', admin_id),
    ('Department for Business and Trade', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Government / Market access', 'Contacted', 'Dace Dimza Jones', 'dace.dimzajones@businessandtrade.gov.uk', 'Known contact; seek UK market-entry and investment support for a cardiovascular medical-device company.', 'LVCN to arrange meeting.', 'Dotter 2026 meet | DBT', admin_id),
    ('LIHE / King''s College London', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'must_pursue', 'University / Clinical trials', 'Contacted', null, null, 'Potential academic and clinical-research partner for technical validation and clinical trials.', 'Follow up on sent outreach.', 'Dotter 2026 meet | LIHE KCL', admin_id),
    ('Innovate UK', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Funding / Innovation', 'Contacted', null, null, 'UK innovation-funding and collaborative R&D route.', 'Follow up on sent outreach.', 'Dotter 2026 meet | Innovate UK', admin_id),
    ('SV Health Investors', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Investors', 'Contacted', null, null, 'Life-sciences investor fit for cardiovascular medtech and evidence-generation plan.', 'Request targeted introduction.', 'Dotter 2026 meet | SV Health', admin_id),
    ('Advent Life Sciences', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Investors', 'Contacted', null, null, 'Sent outreach. Life-sciences investor discussion.', 'Follow up on sent outreach.', 'Dotter 2026 meet | Advent', admin_id),
    ('Medicxi', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Investors', 'Contacted', null, null, 'Specialist life-sciences investor; assess device and diagnostics remit before meeting.', 'Request targeted introduction.', 'Dotter 2026 meet | Medicxi', admin_id),
    ('BGF', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'conditional', 'Investors', 'Contacted', null, null, 'Growth-capital discussion subject to UK operating plan and traction.', 'Request targeted introduction.', 'Dotter 2026 meet | BGF', admin_id),
    ('Cambridge Innovation Capital', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Investors', 'Contacted', null, null, 'Strategic investor and Cambridge clinical/technology network.', 'Request targeted introduction.', 'Dotter 2026 meet | CIC', admin_id),
    ('IP Group', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'conditional', 'Investors', 'Contacted', null, null, 'Assess strategic fit for university-linked medtech commercialisation.', 'Request targeted introduction.', 'Dotter 2026 meet | IP Group', admin_id),
    ('Sofinnova Partners', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Investors', 'Contacted', null, null, 'Specialist healthcare investor; target medtech/diagnostics partner.', 'Request targeted introduction.', 'Dotter 2026 meet | Sofinnova', admin_id),
    ('British Heart Foundation', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Clinical research', 'Contacted', null, null, 'Sent outreach. Cardiovascular research and clinical-network relevance.', 'Follow up on sent outreach.', 'Dotter 2026 meet | BHF', admin_id),
    ('NICE', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'must_pursue', 'Regulatory / Market access', 'Contacted', null, null, 'Sent outreach. Seek early evidence and health-technology assessment guidance.', 'Follow up on sent outreach.', 'Dotter 2026 meet | NICE', admin_id),
    ('MedCity', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Clinical research', 'Contacted', null, null, 'Sent outreach. London life-sciences ecosystem and clinical-research connections.', 'Follow up on sent outreach.', 'Dotter 2026 meet | MedCity', admin_id),
    ('Barts Heart Centre (Barts Health NHS Trust)', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'must_pursue', 'Hospital / Clinical trials', 'Contacted', null, null, 'Potential coronary-intervention clinical partner.', 'Request introduction to interventional cardiology and research leadership.', 'Dotter 2026 meet | Barts Heart Centre', admin_id),
    ('Royal Brompton Hospital', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Hospital / Clinical trials', 'Contacted', null, null, 'Potential cardiovascular clinical-research partner.', 'Request appropriate clinical/research introduction.', 'Dotter 2026 meet | Royal Brompton', admin_id),
    ('Golden Jubilee National Hospital', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'proposed', 'to_arrange', 'strong_option', 'Hospital / Clinical trials', 'Contacted', null, null, 'Sent outreach. Potential cardiovascular intervention and study-site discussion.', 'Follow up on sent outreach.', 'Dotter 2026 meet | Golden Jubilee', admin_id),
    ('ProPharma', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'confirmed', 'verified', 'must_pursue', 'Clinical / Regulatory services', 'Agreed', null, null, 'Agreed. Discuss UK regulatory, clinical and market-access support for Dotter''s device pathway.', 'Confirm meeting time and agenda.', 'Dotter 2026 meet | ProPharma', admin_id),
    ('NAMSA', 'business_meeting', 'selected_organisations', 'optional', 'unknown', 'not_applicable', 'confirmed', 'verified', 'must_pursue', 'Clinical / Regulatory services', 'Agreed', null, null, 'Agreed. Discuss clinical research, regulatory strategy and evidence plan for intravascular diagnostic/device platform.', 'Confirm meeting time and agenda.', 'Dotter 2026 meet | NAMSA', admin_id)
  on conflict do nothing;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, dotter_id from public.schedule_items where source_note like 'Dotter 2026 meet | %'
  on conflict do nothing;

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select id, dotter_id, 'undecided', admin_id from public.schedule_items where source_note like 'Dotter 2026 meet | %'
  on conflict do nothing;
end $$;
