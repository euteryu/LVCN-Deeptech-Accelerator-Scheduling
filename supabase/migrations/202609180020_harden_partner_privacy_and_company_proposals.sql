-- Keep PEN's observer access separate from participant-private communication,
-- and make startup-created proposals manageable by the company across browser
-- sessions. Quick access uses a new anonymous auth identity per browser, so
-- auth.uid() alone is not durable company ownership.

begin;

drop policy if exists "members see own responses" on public.event_responses;
drop policy if exists "startup members see own responses" on public.event_responses;
create policy "startup members see own responses" on public.event_responses
for select to authenticated using (
  public.is_lvnc_admin() or (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'startup_member'
    )
    and organisation_id = public.my_organisation_id()
  )
);

drop policy if exists "members see own availability" on public.availability_blocks;
drop policy if exists "startup members see own availability" on public.availability_blocks;
create policy "startup members see own availability"
on public.availability_blocks for select to authenticated using (
  public.is_lvnc_admin() or (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'startup_member'
    )
    and organisation_id = public.my_organisation_id()
  )
);

drop policy if exists "startups see their updates" on public.startup_updates;
drop policy if exists "startup members see their updates" on public.startup_updates;
create policy "startup members see their updates" on public.startup_updates
for select to authenticated using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'startup_member'
  )
  and organisation_id = public.my_organisation_id()
);

drop policy if exists "startups mark own updates read" on public.startup_updates;
drop policy if exists "startup members mark own updates read" on public.startup_updates;
create policy "startup members mark own updates read" on public.startup_updates
for update to authenticated using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'startup_member'
  )
  and organisation_id = public.my_organisation_id()
) with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'startup_member'
  )
  and organisation_id = public.my_organisation_id()
);

-- Conversation messages inherit the same participant-only boundary.
drop policy if exists "startups see own schedule conversation messages" on public.event_response_messages;
drop policy if exists "startup members see own schedule conversation messages" on public.event_response_messages;
create policy "startup members see own schedule conversation messages"
on public.event_response_messages for select to authenticated using (
  exists (
    select 1
    from public.event_responses response
    join public.profiles profile on profile.id = auth.uid()
    where response.id = event_response_id
      and profile.role = 'startup_member'
      and response.organisation_id = profile.organisation_id
  )
);

alter table public.schedule_items
  add column if not exists created_organisation_id uuid
  references public.organisations(id) on delete set null;

update public.schedule_items item
set created_organisation_id = profile.organisation_id
from public.profiles profile
where item.created_by = profile.id
  and profile.role = 'startup_member'
  and item.created_organisation_id is null;

-- Views expand SELECT * when they are created, so refresh the view definition
-- to expose the new ownership column to participant sessions.
create or replace view public.schedule_events
with (security_invoker = true) as
select *
from public.schedule_items
where item_type <> 'business_meeting'
  and starts_at is not null
  and status <> 'cancelled';

drop policy if exists "members propose own external events" on public.schedule_items;
drop policy if exists "startup members propose company external events" on public.schedule_items;
create policy "startup members propose company external events"
on public.schedule_items for insert to authenticated with check (
  public.is_lvnc_admin() or (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'startup_member'
    )
    and created_by = auth.uid()
    and created_organisation_id = public.my_organisation_id()
    and item_type = 'third_party'
    and status = 'proposed'
    and visibility_scope = 'selected_organisations'
  )
);

drop policy if exists "startup members update company event proposals" on public.schedule_items;
create policy "startup members update company event proposals"
on public.schedule_items for update to authenticated using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'startup_member'
  )
  and created_organisation_id = public.my_organisation_id()
  and item_type = 'third_party'
  and status = 'proposed'
) with check (
  created_organisation_id = public.my_organisation_id()
  and item_type = 'third_party'
  and status = 'proposed'
  and visibility_scope = 'selected_organisations'
);

drop policy if exists "startup members delete company event proposals" on public.schedule_items;
create policy "startup members delete company event proposals"
on public.schedule_items for delete to authenticated using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'startup_member'
  )
  and created_organisation_id = public.my_organisation_id()
  and item_type = 'third_party'
  and status = 'proposed'
);

drop policy if exists "members target own event proposals" on public.schedule_item_organisations;
drop policy if exists "startup members target company event proposals" on public.schedule_item_organisations;
create policy "startup members target company event proposals"
on public.schedule_item_organisations for insert to authenticated with check (
  public.is_lvnc_admin() or (
    exists (
      select 1 from public.schedule_items item
      where item.id = schedule_item_id
        and item.created_organisation_id = public.my_organisation_id()
        and item.item_type = 'third_party'
        and item.status = 'proposed'
        and item.visibility_scope = 'selected_organisations'
    )
    and organisation_id = public.my_organisation_id()
  )
);

drop policy if exists "startup members remove company event proposal targets" on public.schedule_item_organisations;
create policy "startup members remove company event proposal targets"
on public.schedule_item_organisations for delete to authenticated using (
  organisation_id = public.my_organisation_id()
  and exists (
    select 1 from public.schedule_items item
    where item.id = schedule_item_id
      and item.created_organisation_id = public.my_organisation_id()
      and item.item_type = 'third_party'
      and item.status = 'proposed'
  )
);

commit;
