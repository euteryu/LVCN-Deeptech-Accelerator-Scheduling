-- Recon Labs withdrew. Remove its organisation and only its private data.
-- Shared cohort events are preserved; Recon's target/response rows are removed.
do $$
declare
  recon_ids uuid[];
begin
  select coalesce(array_agg(id), '{}'::uuid[])
    into recon_ids
  from public.organisations
  where lower(name) = 'recon labs' or lower(slug) = 'recon-labs';

  if cardinality(recon_ids) = 0 then
    return;
  end if;

  delete from public.event_response_messages erm
  where erm.event_response_id in (
    select er.id from public.event_responses er
    join public.schedule_items si on si.id = er.schedule_item_id
    where er.organisation_id = any(recon_ids)
       or si.created_organisation_id = any(recon_ids)
  );
  delete from public.event_responses er
  where er.organisation_id = any(recon_ids)
     or er.schedule_item_id in (select id from public.schedule_items where created_organisation_id = any(recon_ids));
  delete from public.schedule_item_organisations
  where organisation_id = any(recon_ids);
  delete from public.schedule_item_conflict_groups
  where schedule_item_id in (select id from public.schedule_items where created_organisation_id = any(recon_ids));
  delete from public.schedule_items
  where created_organisation_id = any(recon_ids);
  delete from public.potential_meetings where organisation_id = any(recon_ids);
  delete from public.availability_blocks where organisation_id = any(recon_ids);
  delete from public.app_activity_events where organisation_id = any(recon_ids);
  delete from public.notification_recipients where organisation_id = any(recon_ids);
  delete from public.allowed_invites where organisation_id = any(recon_ids);
  delete from public.profiles where organisation_id = any(recon_ids);
  update public.change_log set organisation_id = null where organisation_id = any(recon_ids);
  delete from public.organisations where id = any(recon_ids);
end $$;
