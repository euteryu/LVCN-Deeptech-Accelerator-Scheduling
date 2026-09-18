-- Retarget Dotter's imported records to the organisation used by the actual
-- Dotter startup login. Run this after dotter_schedule_2026.sql.
do $$
declare
  dotter_id uuid;
  admin_id uuid;
begin
  select p.organisation_id into dotter_id
  from public.profiles p
  join public.organisations o on o.id = p.organisation_id
  where p.role = 'startup_member'
    and lower(o.name) like 'dotter%'
  order by p.created_at
  limit 1;

  if dotter_id is null then
    raise exception 'No signed-in Dotter startup profile was found. Sign in once as the real Dotter startup account, then rerun this file.';
  end if;

  select id into admin_id from public.profiles
  where role = 'lvnc_admin'
  order by created_at
  limit 1;

  delete from public.schedule_item_organisations sio
  using public.schedule_items si
  where sio.schedule_item_id = si.id
    and si.source_note like 'Dotter 2026 %'
    and sio.organisation_id <> dotter_id;

  insert into public.schedule_item_organisations (schedule_item_id, organisation_id)
  select id, dotter_id
  from public.schedule_items
  where source_note like 'Dotter 2026 %'
  on conflict do nothing;

  delete from public.event_responses er
  using public.schedule_items si
  where er.schedule_item_id = si.id
    and si.source_note like 'Dotter 2026 %'
    and er.organisation_id <> dotter_id;

  if admin_id is not null then
    insert into public.event_responses (schedule_item_id, organisation_id, decision, updated_by)
    select id, dotter_id, 'undecided', admin_id
    from public.schedule_items
    where source_note like 'Dotter 2026 %'
    on conflict do nothing;
  end if;
end $$;
