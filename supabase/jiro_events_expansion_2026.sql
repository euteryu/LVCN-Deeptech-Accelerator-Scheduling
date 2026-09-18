-- Additional future Jiro / Dropshot AI events after the first event pass.
-- Run manually in Supabase SQL Editor. Safe to rerun.
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
  if jiro_id is null then raise exception 'Could not resolve or create Jiro organisation.'; end if;
  if admin_id is null then raise exception 'No LVCN admin profile exists.'; end if;

  with events (title, description, starts_at, ends_at, time_precision, location, event_url, cost_type, cost_note, priority, fit, next_action, source_note) as (values
    ('Web Summit Lisbon 2026', 'Large European technology conference with dedicated AI, Venture Summit, startup, investor and media tracks.', '2026-11-09T09:00:00+00:00'::timestamptz, '2026-11-12T18:00:00+00:00'::timestamptz, 'all_day'::public.time_precision, 'MEO Arena, Lisbon, Portugal', 'https://websummit.com/web-summit-2026/', 'paid'::public.cost_type, 'Startup and investor access varies; apply early.', 'must_pursue'::public.item_priority, 'High-density route to Series B investors, enterprise AI buyers, global media and creative-technology partners; the 2026 speaker list includes Runway, Magnific, Accel and a16z.', 'Apply through the startup/investor route and pre-book meetings with AI, media, marketing and venture attendees.', 'Jiro events expansion 2026 | Web Summit Lisbon'),
    ('Slush 2026 - Investor Day and Main Event', 'Founder-focused European startup and venture gathering with structured investor meetings and side events.', '2026-11-17T12:00:00+00:00'::timestamptz, '2026-11-19T19:00:00+00:00'::timestamptz, 'exact'::public.time_precision, 'Finlandia Hall and Messukeskus, Helsinki', 'https://slush.org/', 'paid'::public.cost_type, 'Investor Day is 17 November; main event is 18-19 November.', 'strong_option'::public.item_priority, 'Potentially valuable for a planned Series B and European investor discovery, particularly among AI and software funds outside the UK network.', 'Use the meeting tool before travelling; target AI, SaaS, creator-economy and European expansion investors.', 'Jiro events expansion 2026 | Slush'),
    ('Content London 2026', 'Global content ecosystem market, conference and screenings focused on TV, film, streaming, digital content, creators and IP partnerships.', '2026-11-30T09:00:00+00:00'::timestamptz, '2026-12-03T18:00:00+00:00'::timestamptz, 'all_day'::public.time_precision, 'London, UK', 'https://www.contentevents.net/event/ef43af00-ba07-4fb9-aa65-b798c655b8df/home', 'paid'::public.cost_type, 'Confirm delegate and meeting-market access.', 'must_pursue'::public.item_priority, 'Direct route to OTT, broadcasters, creator-led media, production companies and IP owners who may need high-volume, rights-aware AI video workflows.', 'Prepare a production case study and request meetings with content commissioners, production operations and rights holders.', 'Jiro events expansion 2026 | Content London'),
    ('Web Summit Venture Summit and AI track', 'Targeted Web Summit programming for venture capital, AI founders, enterprise buyers and technology leaders.', '2026-11-09T10:00:00+00:00'::timestamptz, '2026-11-12T17:00:00+00:00'::timestamptz, 'all_day'::public.time_precision, 'MEO Arena, Lisbon, Portugal', 'https://websummit.com/tracks/venture-summit', 'paid'::public.cost_type, 'Included or separately restricted depending on ticket type.', 'strong_option'::public.item_priority, 'A more focused reason to attend Web Summit: investor-meeting infrastructure and AI-specific programming aligned to Dropshot''s Series B and enterprise expansion.', 'Select the AI and Venture Summit tracks; pre-book investor meetings instead of relying on general networking.', 'Jiro events expansion 2026 | Web Summit Venture and AI')
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
  where item.source_note like 'Jiro events expansion 2026 | %'
    and not exists (select 1 from public.schedule_item_organisations target where target.schedule_item_id = item.id and target.organisation_id = jiro_id);

  insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
  select item.id, jiro_id, 'undecided', admin_id from public.schedule_items item
  where item.source_note like 'Jiro events expansion 2026 | %'
  on conflict (schedule_item_id, organisation_id) do nothing;
end $$;
