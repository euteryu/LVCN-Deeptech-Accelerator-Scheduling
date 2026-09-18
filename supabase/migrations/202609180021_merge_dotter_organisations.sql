-- Consolidate the historical duplicate Dotter organisations without recreating
-- programme content. The canonical organisation is the one used by the current
-- allow-list. This migration is safe to rerun.

do $$
declare
  canonical_id uuid;
  legacy record;
  source_response record;
  target_response_id uuid;
  source_meeting record;
  target_meeting_id uuid;
begin
  select organisation_id into canonical_id
  from public.allowed_invites
  where lower(email) = 'h.i.kim@dotter.com';

  if canonical_id is null then
    raise exception 'The canonical Dotter allow-list entry is missing.';
  end if;

  for legacy in
    select id
    from public.organisations
    where id <> canonical_id
      and (lower(name) like 'dotter%' or slug like 'dotter%')
  loop
    -- Preserve targeting metadata before removing the duplicate target.
    insert into public.schedule_item_organisations (
      schedule_item_id, organisation_id, meeting_outreach_status,
      availability_note, coordination_note
    )
    select schedule_item_id, canonical_id, meeting_outreach_status,
      availability_note, coordination_note
    from public.schedule_item_organisations
    where organisation_id = legacy.id
    on conflict (schedule_item_id, organisation_id) do update set
      meeting_outreach_status = case
        when excluded.meeting_outreach_status in ('Agreed', 'Rejected')
          then excluded.meeting_outreach_status
        else public.schedule_item_organisations.meeting_outreach_status
      end,
      availability_note = coalesce(
        excluded.availability_note,
        public.schedule_item_organisations.availability_note
      ),
      coordination_note = coalesce(
        excluded.coordination_note,
        public.schedule_item_organisations.coordination_note
      );

    -- Merge response rows one at a time so conversations remain attached to
    -- the surviving response if both organisations answered the same event.
    for source_response in
      select * from public.event_responses where organisation_id = legacy.id
    loop
      select id into target_response_id
      from public.event_responses
      where schedule_item_id = source_response.schedule_item_id
        and organisation_id = canonical_id;

      if target_response_id is null then
        update public.event_responses
        set organisation_id = canonical_id
        where id = source_response.id;
      else
        update public.event_response_messages
        set event_response_id = target_response_id
        where event_response_id = source_response.id;

        update public.event_responses target
        set decision = source_response.decision,
            note = source_response.note,
            updated_by = source_response.updated_by,
            updated_at = source_response.updated_at,
            admin_reviewed_at = source_response.admin_reviewed_at,
            admin_reviewed_by = source_response.admin_reviewed_by,
            attendance_plan = source_response.attendance_plan,
            attendance_starts_at = source_response.attendance_starts_at,
            attendance_ends_at = source_response.attendance_ends_at,
            conversation_status = source_response.conversation_status,
            admin_response_status = source_response.admin_response_status,
            admin_replied_at = source_response.admin_replied_at,
            admin_replied_by = source_response.admin_replied_by
        where target.id = target_response_id
          and source_response.updated_at > target.updated_at;

        delete from public.event_responses where id = source_response.id;
      end if;
    end loop;

    delete from public.schedule_item_organisations
    where organisation_id = legacy.id;

    -- Potential Biz Meets are also company-specific. Move unique rows and
    -- merge any same-name duplicates while retaining their private details,
    -- latest decision and linked startup updates.
    for source_meeting in
      select * from public.potential_meetings where organisation_id = legacy.id
    loop
      select id into target_meeting_id
      from public.potential_meetings
      where organisation_id = canonical_id
        and lower(trim(institution_name)) = lower(trim(source_meeting.institution_name))
      order by updated_at desc
      limit 1;

      if target_meeting_id is null then
        update public.potential_meetings
        set organisation_id = canonical_id
        where id = source_meeting.id;
      else
        update public.potential_meetings target
        set category = source_meeting.category,
            status = source_meeting.status,
            proposed_starts_at = source_meeting.proposed_starts_at,
            proposed_ends_at = source_meeting.proposed_ends_at,
            location = source_meeting.location,
            external_url = source_meeting.external_url,
            startup_visible_note = source_meeting.startup_visible_note,
            next_action = source_meeting.next_action,
            owner_profile_id = source_meeting.owner_profile_id,
            updated_at = source_meeting.updated_at
        where target.id = target_meeting_id
          and source_meeting.updated_at > target.updated_at;

        insert into public.potential_meeting_admin_details (
          potential_meeting_id, contact_name, contact_email, internal_note,
          updated_by, updated_at
        )
        select target_meeting_id, contact_name, contact_email, internal_note,
          updated_by, updated_at
        from public.potential_meeting_admin_details
        where potential_meeting_id = source_meeting.id
        on conflict (potential_meeting_id) do update set
          contact_name = excluded.contact_name,
          contact_email = excluded.contact_email,
          internal_note = excluded.internal_note,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at
        where excluded.updated_at > public.potential_meeting_admin_details.updated_at;

        insert into public.potential_meeting_decisions (
          potential_meeting_id, decision, note, updated_by, updated_at,
          admin_reviewed_at, admin_reviewed_by, priority_rating
        )
        select target_meeting_id, decision, note, updated_by, updated_at,
          admin_reviewed_at, admin_reviewed_by, priority_rating
        from public.potential_meeting_decisions
        where potential_meeting_id = source_meeting.id
        on conflict (potential_meeting_id) do update set
          decision = excluded.decision,
          note = excluded.note,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at,
          admin_reviewed_at = excluded.admin_reviewed_at,
          admin_reviewed_by = excluded.admin_reviewed_by,
          priority_rating = excluded.priority_rating
        where excluded.updated_at > public.potential_meeting_decisions.updated_at;

        update public.startup_updates
        set potential_meeting_id = target_meeting_id,
            organisation_id = canonical_id
        where potential_meeting_id = source_meeting.id;

        delete from public.potential_meetings where id = source_meeting.id;
      end if;
    end loop;

    update public.allowed_invites set organisation_id = canonical_id where organisation_id = legacy.id;
    update public.notification_recipients set organisation_id = canonical_id where organisation_id = legacy.id;
    update public.profiles set organisation_id = canonical_id where organisation_id = legacy.id;
    update public.availability_blocks set organisation_id = canonical_id where organisation_id = legacy.id;
    update public.app_activity_events set organisation_id = canonical_id where organisation_id = legacy.id;
    update public.startup_updates set organisation_id = canonical_id where organisation_id = legacy.id;
    update public.change_log set organisation_id = canonical_id where organisation_id = legacy.id;
    update public.schedule_items set created_organisation_id = canonical_id where created_organisation_id = legacy.id;

    -- All known references have now been preserved on the canonical company.
    delete from public.organisations where id = legacy.id;
  end loop;

  update public.organisations
  set name = 'Dotter', slug = 'dotter'
  where id = canonical_id;
end;
$$;
