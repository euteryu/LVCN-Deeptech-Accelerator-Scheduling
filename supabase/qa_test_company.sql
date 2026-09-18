-- Explicit QA fixtures only. Re-running preserves tester decisions and edits.
begin;
do $$
declare
  test_org uuid;
  admin_actor uuid;
  event_id uuid;
  fixture record;
begin
  select id into admin_actor from public.profiles where role='lvnc_admin' order by created_at limit 1;
  if admin_actor is null then raise exception 'An existing admin is required'; end if;
  insert into public.organisations(name,slug) values ('TEST_COMPANY','test-company') on conflict (slug) do nothing;
  select id into strict test_org from public.organisations where slug='test-company' and name='TEST_COMPANY';
  if exists(select 1 from public.allowed_invites where email='test@testuser.co.uk' and organisation_id is distinct from test_org) then
    raise exception 'Test email already belongs to another organisation';
  end if;
  insert into public.allowed_invites(email,full_name,role,organisation_id)
  values ('test@testuser.co.uk','QA Test User','startup_member',test_org) on conflict (email) do nothing;
  for fixture in select * from (values
    ('[TEST] Manufacturing showcase - full day','2026-09-29 09:00+01','2026-09-29 18:00+01','paid','Test ticket: GBP 95; fictional event, do not book.'),
    ('[TEST] Investor roundtable - overlapping afternoon','2026-09-29 15:00+01','2026-09-29 17:00+01','free','Free test event; fictional, do not attend.'),
    ('[TEST] Research partner workshop','2026-09-30 10:00+01','2026-09-30 11:00+01','free','Use this item to test accept, reject and restore.')
  ) as f(title,starts_at,ends_at,cost_type,cost_note) loop
    select si.id into event_id from public.schedule_items si join public.schedule_item_organisations sio on sio.schedule_item_id=si.id
    where sio.organisation_id=test_org and si.title=fixture.title;
    if event_id is null then
      insert into public.schedule_items(title,description,item_type,visibility_scope,attendance_rule,starts_at,ends_at,time_precision,location,cost_type,cost_note,status,booking_status,next_action,created_by)
      values(fixture.title,'Fictional QA fixture for TEST_COMPANY only.','third_party','selected_organisations','optional',fixture.starts_at::timestamptz,fixture.ends_at::timestamptz,'exact','London - fictional test venue',fixture.cost_type::public.cost_type,fixture.cost_note,'proposed','details_to_verify','TEST: review the details and submit a decision.',admin_actor)
      returning id into event_id;
      insert into public.schedule_item_organisations(schedule_item_id,organisation_id) values(event_id,test_org);
    end if;
  end loop;
  insert into public.potential_meetings(organisation_id,institution_name,category,status,startup_visible_note,next_action,created_by)
  select test_org, v.name,v.category,'draft','Fictional institution for QA only. No real outreach.','TEST: accept or reject, then check the admin inbox.',admin_actor
  from (values ('[TEST] Sample Robotics Investor','Investor'),('[TEST] Sample Manufacturing Partner','Corporate partner'),('[TEST] Sample Research Institute','Research')) v(name,category)
  where not exists(select 1 from public.potential_meetings p where p.organisation_id=test_org and p.institution_name=v.name);
end $$;
commit;
