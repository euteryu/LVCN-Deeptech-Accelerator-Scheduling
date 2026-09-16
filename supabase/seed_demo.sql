-- Optional representative database seed. Run after an LVCN admin has signed in
-- (so profiles contains a real auth user for created_by). It is idempotent by
-- title and is intentionally separate from the organisation allow-list seed.
do $$
declare admin_id uuid;
declare cohort_event uuid;
declare opportunity uuid;
declare alternative_a uuid;
declare alternative_b uuid;
declare tech_event uuid;
declare climate_event uuid;
declare dinner_event uuid;
begin
  select id into admin_id from public.profiles where role = 'lvnc_admin' limit 1;
  if admin_id is null then raise exception 'Sign in an LVCN admin before running supabase/seed_demo.sql'; end if;

  insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, cost_type, status, booking_status, priority, next_action, created_by)
  values ('Cohort orientation and programme briefing', 'Welcome, programme priorities and practical arrangements.', 'lvnc_core', 'cohort', 'compulsory', now() + interval '2 days', now() + interval '2 days 90 minutes', 'exact', 'LVCN, Canary Wharf', 'not_applicable', 'confirmed', 'not_required', 'must_pursue', 'Arrive 10 minutes early.', admin_id)
  on conflict do nothing returning id into cohort_event;

  insert into public.schedule_items (title, description, item_type, visibility_scope, attendance_rule, time_precision, location, cost_type, status, booking_status, priority, next_action, created_by)
  values ('Retail buyer introduction', 'Potential buyer meeting; exact time to confirm.', 'business_meeting', 'selected_organisations', 'recommended', 'unknown', 'London - TBC', 'not_applicable', 'proposed', 'to_arrange', 'must_pursue', 'Share availability.', admin_id)
  on conflict do nothing returning id into opportunity;

  insert into public.conflict_groups (name, description, max_selections) values ('Full-day Wednesday options', 'Choose the strongest full-day opportunity.', 1) returning id into alternative_a;
  insert into public.conflict_groups (name, description, max_selections) values ('Thursday evening options', 'Coordinate one hosted evening option.', 1) returning id into alternative_b;
  insert into public.schedule_items (title, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, cost_type, status, booking_status, priority, created_by)
  values ('London Tech Leaders Forum', 'third_party', 'cohort', 'optional', now() + interval '4 days 9 hours', now() + interval '4 days 17 hours', 'all_day', 'Olympia London', 'paid', 'proposed', 'to_register', 'strong_option', admin_id) returning id into tech_event;
  insert into public.schedule_items (title, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, cost_type, status, booking_status, priority, created_by)
  values ('Climate Innovation Summit', 'third_party', 'cohort', 'optional', now() + interval '4 days 9 hours', now() + interval '4 days 16 hours', 'all_day', 'County Hall', 'free', 'proposed', 'approval_required', 'conditional', admin_id) returning id into climate_event;
  insert into public.schedule_items (title, item_type, visibility_scope, attendance_rule, starts_at, ends_at, time_precision, location, cost_type, status, booking_status, priority, created_by)
  values ('Korea-UK investor dinner', 'third_party', 'cohort', 'optional', now() + interval '5 days 18 hours', now() + interval '5 days 21 hours', 'evening', 'Central London - TBC', 'unknown', 'proposed', 'invite_required', 'strong_option', admin_id) returning id into dinner_event;
  insert into public.schedule_item_conflict_groups (schedule_item_id, conflict_group_id) values (tech_event, alternative_a), (climate_event, alternative_a), (dinner_event, alternative_b) on conflict do nothing;

  if cohort_event is not null then insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by) select cohort_event, id, case when slug in ('greenroute','nova-foods') then 'undecided'::public.event_decision else 'acknowledged'::public.event_decision end, admin_id from public.organisations on conflict do nothing; end if;
  insert into public.availability_blocks (organisation_id, title, starts_at, ends_at, created_by) select id, 'Existing investor call', now() + interval '4 days 14 hours', now() + interval '4 days 15 hours 30 minutes', admin_id from public.organisations where slug = 'seoul-labs' on conflict do nothing;
end $$;
