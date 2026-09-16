-- Route each logged change into recipient-specific digest queues.
-- A delivery function will later send all pending rows for one recipient in
-- a single email after the five-minute window.

create or replace function public.queue_change_digest() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notification_digest_queue (recipient_email, change_log_id, deliver_after)
  select r.email, new.id, now() + interval '5 minutes'
  from public.notification_recipients r
  where r.receives_digest
    and (
      r.is_lvnc_admin
      or (
        new.entity_type in ('event_response', 'availability_block')
        and r.organisation_id = new.organisation_id
      )
      or (
        new.entity_type = 'schedule_item'
        and (
          new.details ->> 'visibility_scope' = 'cohort'
          or exists (
            select 1
            from public.schedule_item_organisations sio
            where sio.schedule_item_id = new.record_id
              and sio.organisation_id = r.organisation_id
          )
        )
      )
    )
  on conflict (recipient_email, change_log_id) do nothing;
  return new;
end;
$$;

drop trigger if exists change_log_digest_queue on public.change_log;
create trigger change_log_digest_queue
after insert on public.change_log
for each row execute function public.queue_change_digest();
