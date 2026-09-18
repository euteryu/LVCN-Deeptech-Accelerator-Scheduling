-- JIRO/Dropshot AI was offered events beyond the programme end date.
-- Keep the programme bounded at 23 October 2026 and remove only records
-- explicitly targeted to JIRO after that date.
begin;

with targets as (
  select si.id
  from public.schedule_items si
  where si.starts_at >= '2026-10-24'::timestamptz
    and exists (
      select 1
      from public.schedule_item_organisations sio
      where sio.schedule_item_id = si.id
        and sio.organisation_id = '99999999-9999-4999-8999-999999999995'
    )
), deleted_messages as (
  delete from public.event_response_messages erm
  where erm.event_response_id in (
    select er.id from public.event_responses er
    where er.schedule_item_id in (select id from targets)
  )
  returning 1
), deleted_responses as (
  delete from public.event_responses er
  where er.schedule_item_id in (select id from targets)
  returning 1
), deleted_targeting as (
  delete from public.schedule_item_organisations sio
  where sio.schedule_item_id in (select id from targets)
  returning 1
)
delete from public.schedule_items si
where si.id in (select id from targets);

commit;
