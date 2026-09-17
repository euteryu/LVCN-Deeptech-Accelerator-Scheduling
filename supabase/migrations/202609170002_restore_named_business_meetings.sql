-- Correct the initial visibility backfill. Older imported records had no
-- persisted category, so they must not all be treated as generic diary holds.
-- Only literal Morning/Afternoon Business Meetings placeholders remain hidden.
update public.schedule_items
set meeting_category = case
  when title in (
    'MD One',
    'Seraphim Space',
    'Octopus Ventures',
    'Foresight Group',
    'Molten Ventures',
    'GB Ventures',
    'IQ Capital',
    'Amadeus Capital Partners',
    'Ahren Innovation Capital',
    'Paladin Capital Group',
    'BGF Early Stage',
    'Cambridge Innovation Capital',
    'Parkwalk Advisors',
    'Atlantic Bridge',
    'AlbionVC',
    'Balderton Capital',
    'Atomico',
    'Lakestar',
    'Northzone',
    'EQT Ventures',
    'Dawn Capital',
    'Highland Europe',
    'M&G Catalyst',
    'Schroders Capital',
    'British Patient Capital',
    'Future Fund: Breakthrough',
    'SoftBank Vision Fund',
    'General Catalyst',
    'Lux Capital',
    'DCVC',
    'Eclipse',
    'Playground Global',
    'E14 Fund',
    'Longwall Ventures',
    'Northern Gritstone',
    'MMC Ventures',
    'Crane Venture Partners',
    'Entrepreneur First',
    'LocalGlobe',
    'Seedcamp',
    'Hoxton Ventures',
    'Notion Capital',
    'Kindred Capital',
    'Frontline Ventures',
    'Beringea',
    'Speedinvest',
    'OTB Ventures'
  ) then 'VCs'
  when title in ('In Motion Ventures (JLR CVC)', 'Prosus Ventures')
    then 'CVCs / Corporate Investors'
  when title in (
    'NATO Innovation Fund',
    'DASA (Defence and Security Accelerator)',
    'BAE Systems (FalconWorks)',
    'QinetiQ',
    'Thales UK',
    'Leonardo UK',
    'Chess Dynamics (Elbit Systems UK)',
    'MBDA UK',
    'Saab UK',
    'Rolls-Royce (Defence)',
    'Frazer-Nash Consultancy',
    'NSSIF',
    'Dstl',
    'NATO DIANA',
    'Cohort plc'
  ) then 'Defence & Security'
  when title in ('Zenzic', 'HORIBA MIRA', 'Millbrook Proving Ground', 'Smart Mobility Living Lab', 'Oxbotica', 'Wayve')
    then 'Mobility & Automotive'
  when title in ('Connected Places Catapult', 'Teledyne e2v', 'Plexal')
    then 'Deep-Tech / Technology Ecosystem'
  when title like 'Business Meetings (%' then 'Business meeting'
  else 'Potential Biz Meets'
end
where item_type = 'business_meeting'
  and meeting_category = 'Business meeting';

-- The named items above are visible again. Keep only generic diary holds
-- hidden for startup accounts.
insert into public.meeting_category_visibility (category, visible_to_startups)
values ('Business meeting', false)
on conflict (category) do update set visible_to_startups = excluded.visible_to_startups;
