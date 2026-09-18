-- PA Robotics: high-relevance UK external events during the SVC programme
-- window, 28 September-23 October 2026. Sources and fit are recorded with
-- every item so they can be audited in the Programme Record. Safe to rerun.
do $$
declare
  pa_id uuid := '99999999-9999-4999-8999-999999999996'::uuid;
  admin_id uuid;
begin
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  if admin_id is null then raise exception 'An existing LVCN admin is required'; end if;

  with events(title, description, starts_at, ends_at, time_precision, location, event_url, cost_note, priority, fit, next_action, source_note) as (
    values
      ('Scottish Manufacturing & Supply Chain Conference',
       'Manufacturing exhibition and Meet the Buyer programme covering robotics, automation, digital manufacturing and Industry 4.0.',
       '2026-09-30T09:00:00+01:00'::timestamptz, '2026-10-01T17:00:00+01:00'::timestamptz, 'exact', 'SEC Centre, Glasgow',
       'https://www.sdpscotland.co.uk/events/scottish-manufacturing-and-supply-chain-conference-2002/', 'Registration details to verify.', 'strong_option',
       'Direct route to UK manufacturing decision-makers and buyer conversations relevant to dark-factory assembly, vision inspection and systems integration.',
       'Register only if Glasgow travel is justified; pre-book manufacturer, integrator and automation meetings.',
       'PA Robotics 2026 external event | Supplier Development Programme: 30 September-1 October, Glasgow.'),
      ('Smart Factories Summit Europe 2026',
       'London summit on intelligent automation, industrial robotics, AI-driven operations, digital twins and manufacturing transformation.',
       '2026-10-06T00:00:00+01:00'::timestamptz, '2026-10-06T23:59:00+01:00'::timestamptz, 'all_day', 'Millennium Gloucester Hotel, Kensington, London',
       'https://www.amg-world.co.uk/smart-factories-summit-europe/', 'Registration required; pricing to verify.', 'must_pursue',
       'High-density London audience of smart-factory, automation, operations and digital-manufacturing leaders aligned with PAIS and i-Series positioning.',
       'Register and seek targeted introductions to manufacturing operations, automation and AI leaders before arrival.',
       'PA Robotics 2026 external event | Smart Factories Summit Europe: 6 October, London.'),
      ('Engineering Design Show 2026',
       'UK design-engineering exhibition and conference spanning electronic, embedded and mechanical design, manufacturing, motion control and production technologies.',
       '2026-10-07T09:30:00+01:00'::timestamptz, '2026-10-08T16:00:00+01:00'::timestamptz, 'exact', 'Coventry Building Society Arena, Coventry',
       'https://www.engineeringdesignshow.co.uk/', 'Free visitor registration.', 'must_pursue',
       'Strong match for electronics/EMS manufacturing, machine vision and robotics partners; the programme includes a Physical AI and UK robotics session involving MTC and National Robotarium speakers.',
       'Register for 7 October, attend the Physical AI session, and pre-identify electronics, motion-control and manufacturing-partner exhibitors.',
       'PA Robotics 2026 external event | Engineering Design Show: 7-8 October, Coventry.'),
      ('WMG Battery Seminar Day: Battery Coatings, Electrode Architecture and Cell Characterisation',
       'Industry-academic seminar at WMG on battery manufacture, electrode architecture and cell engineering.',
       '2026-10-13T00:00:00+01:00'::timestamptz, '2026-10-13T23:59:00+01:00'::timestamptz, 'all_day', 'WMG, University of Warwick, Coventry',
       'https://www.scimed.co.uk/wmg-battery-seminar-day/', 'Registration required; pricing to verify.', 'strong_option',
       'Relevant battery-manufacturing ecosystem entry point for quality-critical assembly, inspection and automation PoCs.',
       'Confirm attendee profile and request introductions to battery-manufacturing and industrialisation contacts.',
       'PA Robotics 2026 external event | WMG Battery Seminar Day: 13 October, Coventry.'),
      ('MachineBuilding.Live & FoodManufacturing.Live 2026',
       'One-day UK machine-building and automation event for OEMs, system integrators and manufacturing professionals, with machine-vision, industrial-networking and machinery-safety sessions.',
       '2026-10-14T09:00:00+01:00'::timestamptz, '2026-10-14T15:00:00+01:00'::timestamptz, 'exact', 'NAEC Stoneleigh, Warwickshire',
       'https://foodmanufacturing.live/', 'Free visitor entry; register in advance.', 'must_pursue',
       'Practical access to UK machine builders, systems integrators and automation suppliers; directly supports PA Robotics'' need for SI and manufacturer PoC partners.',
       'Register and schedule conversations with integrators, machine-vision providers and machinery-safety specialists.',
       'PA Robotics 2026 external event | MachineBuilding.Live & FoodManufacturing.Live: 14 October, Stoneleigh.'),
      ('ROSCon UK 2026',
       'UK robotics developer conference with workshops, exhibition and industrial-automation content including ROS 2 control.',
       '2026-10-21T00:00:00+01:00'::timestamptz, '2026-10-23T23:59:00+01:00'::timestamptz, 'all_day', 'Pollock Estate Complex, Edinburgh',
       'https://roscon.org.uk/2026/', 'Registration and Edinburgh travel required.', 'strong_option',
       'High-quality robotics ecosystem route for technical partnerships, ROS integration intelligence and recruiting/integrator conversations.',
       'Attend only with a defined ROS/industrial-automation partnership agenda and pre-arranged meetings.',
       'PA Robotics 2026 external event | ROSCon UK: 21-23 October, Edinburgh.'),
      ('SAP NOW AI Tour UKI 2026',
       'Birmingham enterprise AI event for technology, supply-chain, automotive, high-tech and industrial-manufacturing leaders.',
       '2026-10-22T00:00:00+01:00'::timestamptz, '2026-10-22T23:59:00+01:00'::timestamptz, 'all_day', 'NEC Birmingham, Birmingham',
       'https://www.sap.com/uk/events/2026-10-22-uk-now-ai-tour-uki.html', 'Registration required; pricing to verify.', 'conditional',
       'Useful for MES/ERP and enterprise-manufacturing integration conversations, supporting PA Robotics'' data-platform and factory-integration story.',
       'Prioritise only if an SAP/MES integration partner or manufacturing enterprise meeting can be arranged.',
       'PA Robotics 2026 external event | SAP NOW AI Tour UKI: 22 October, Birmingham.')
  ), inserted as (
    insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, status, booking_status, priority, fit, next_action, source_note, created_by)
    select title, description, 'third_party', 'selected_organisations', 'recommended', starts_at, ends_at, time_precision::public.time_precision, location, event_url, 'free'::public.cost_type, cost_note, 'proposed', 'to_register', priority::public.item_priority, fit, next_action, source_note, admin_id
    from events e
    where not exists (select 1 from public.schedule_items existing where existing.source_note = e.source_note)
    returning id
  )
  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, pa_id from inserted;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select item.id, pa_id
  from public.schedule_items item
  where item.source_note like 'PA Robotics 2026 external event | %'
    and not exists (select 1 from public.schedule_item_organisations target where target.schedule_item_id = item.id and target.organisation_id = pa_id);

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select item.id, pa_id, 'undecided', admin_id
  from public.schedule_items item
  where item.source_note like 'PA Robotics 2026 external event | %'
  on conflict (schedule_item_id, organisation_id) do nothing;
end $$;
