-- Additional verified, PA Robotics-specific UK opportunities during the
-- 28 September-23 October 2026 programme window. Safe to rerun.
-- Sources are retained on every item for review in the application.
do $$
declare
  pa_id uuid;
  admin_id uuid;
begin
  select id into pa_id from public.organisations where slug = 'pa-robotics';
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;

  if pa_id is null then raise exception 'PA Robotics organisation is missing.'; end if;
  if admin_id is null then raise exception 'No LVCN admin profile exists. Sign in once as an LVCN admin, then run this script.'; end if;

  with events (title, description, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, priority, fit, next_action, source_note) as (
    values
      ('Tomorrow''s Warehouse Manchester 2026',
       'One-day warehouse, logistics and supply-chain technology event with a stated audience of warehouse, logistics, distribution, operations, production and facilities decision-makers.',
       '2026-09-30T08:30:00+01:00'::timestamptz, '2026-09-30T17:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'Emirates Old Trafford, Manchester',
       'https://www.tomorrowswarehouse.live/manchester-why-exhibit/', 'free'::public.cost_type, 'Visitor registration required; confirm current terms.', 'strong_option'::public.item_priority,
       'A practical customer and partner route for automation, material flow, vision, traceability and operational-deployment conversations.',
       'Attend only with a warehouse/manufacturing target list; prioritise operations leaders, automation suppliers and integrators.',
       'PA Robotics UK opportunities | Tomorrow''s Warehouse Manchester'),
      ('Made in the Midlands Expo 2026',
       'Manufacturer-only regional expo bringing together manufacturing leaders, engineers and supply-chain decision-makers for practical networking and business development.',
       '2026-10-08T09:00:00+01:00'::timestamptz, '2026-10-08T15:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'Pallet Track Stadium, Bescot, Walsall',
       'https://madeinthemidlands.com/events/made-in-the-midlands-expo-2026', 'free'::public.cost_type, 'Free visitor registration stated by organiser.', 'must_pursue'::public.item_priority,
       'A highly efficient Midlands route to manufacturers that could become PAIS/i-Series pilots, customers, engineering partners or introductions.',
       'Register; create a short target list by sector and ask Made in Group for introductions to manufacturers with automation, quality or labour constraints.',
       'PA Robotics UK opportunities | Made in the Midlands Expo'),
      ('North East Manufacturing Innovation Forum: Then, Now & Next',
       'Manufacturing innovation forum covering industrial automation, robotics, cobots, AMRs, mobile manipulation, AI vision, safety and cybersecurity, with live demonstrations and manufacturer-facing discussion.',
       '2026-10-21T09:30:00+01:00'::timestamptz, '2026-10-21T16:30:00+01:00'::timestamptz, 'exact'::public.time_precision, 'SASMI Building, Sunderland',
       'https://automationworld.co/event/north-east-manufacturing-innovation-forum/', 'free'::public.cost_type, 'Registration details to confirm with organiser.', 'strong_option'::public.item_priority,
       'Very direct thematic fit: manufacturer, automation and robotics ecosystem contacts who can validate use cases, supply capability or form deployment partnerships.',
       'Confirm attendance and travel only after arranging at least two relevant manufacturer, integrator or automation-provider conversations.',
       'PA Robotics UK opportunities | North East Manufacturing Innovation Forum'),
      ('Birmingham Tech Week 2026 — PA Robotics Partnering Track',
       'Birmingham Tech Week''s multi-event programme provides a local route to West Midlands founders, customers, investors, technology partners and the regional manufacturing-tech ecosystem.',
       '2026-10-19T09:00:00+01:00'::timestamptz, '2026-10-23T18:00:00+01:00'::timestamptz, 'all_day'::public.time_precision, 'Birmingham (multiple venues)',
       'https://birminghamtechweek.com/', 'unknown'::public.cost_type, 'Choose individual sessions and networking events; ticket terms vary.', 'conditional'::public.item_priority,
       'Useful locally while PA Robotics is already in the West Midlands: choose only sessions that create credible industrial, platform, investor or hiring conversations.',
       'Review the live agenda; select one manufacturing/AI session and one networking event, with named people to meet at each.',
       'PA Robotics UK opportunities | Birmingham Tech Week Partnering Track'),
      ('Engineering & Developer Conference 2026',
       'Birmingham Tech Week conference focused on real-world engineering and developer systems, including mobility, manufacturing, enterprise technology and AI.',
       '2026-10-23T08:00:00+01:00'::timestamptz, '2026-10-23T16:00:00+01:00'::timestamptz, 'exact'::public.time_precision, 'ICC Birmingham, Birmingham',
       'https://birminghamtechweek.com/event/eng-dev-conf-2026/', 'unknown'::public.cost_type, 'Registration and delegate rate to verify.', 'strong_option'::public.item_priority,
       'Good complement to machinery events: a route to engineering leaders, technical partners and platform/integration talent relevant to PA Robotics'' deployment and data story.',
       'Register if the published agenda includes manufacturing, AI systems or enterprise integration; use the event to secure 3-5 engineering-partner conversations.',
       'PA Robotics UK opportunities | Engineering & Developer Conference')
  ), inserted as (
    insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
    select title, description, 'third_party', 'selected_organisations', 'optional', starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, 'proposed', 'to_register', priority, fit, next_action, source_note, admin_id
    from events event
    where not exists (select 1 from public.schedule_items existing where existing.title = event.title and existing.starts_at = event.starts_at)
    returning id
  )
  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, pa_id from inserted
  on conflict do nothing;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select item.id, pa_id
  from public.schedule_items item
  where item.source_note like 'PA Robotics UK opportunities | %'
    and not exists (select 1 from public.schedule_item_organisations target where target.schedule_item_id = item.id and target.organisation_id = pa_id);

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select item.id, pa_id, 'undecided', admin_id
  from public.schedule_items item
  where item.source_note like 'PA Robotics UK opportunities | %'
  on conflict (schedule_item_id, organisation_id) do nothing;
end $$;
