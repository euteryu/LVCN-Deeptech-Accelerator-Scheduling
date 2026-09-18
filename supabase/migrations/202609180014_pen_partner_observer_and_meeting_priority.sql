-- PEN Ventures: partner access is deliberately a separate read-only role.
-- partner_observer is included in the initial app_role enum so fresh database
-- builds can use it in policies within the same migration transaction.

create or replace function public.is_partner_observer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'partner_observer');
$$;
revoke all on function public.is_partner_observer() from public;
grant execute on function public.is_partner_observer() to authenticated;

-- Observers may see published programme schedules for every startup, but not
-- responses, availability, Potential Biz Meets, contacts, notes or updates.
drop policy if exists "members see allowed schedule items" on public.schedule_items;
create policy "members and observers see allowed schedule items" on public.schedule_items for select to authenticated using (
  public.is_lvnc_admin() or public.is_partner_observer() or (
    ((item_type = 'lvnc_core' and status = 'confirmed') or (item_type <> 'lvnc_core' and status in ('proposed', 'confirmed'))) and (
      visibility_scope = 'cohort' or exists (
        select 1 from public.schedule_item_organisations sio
        where sio.schedule_item_id = schedule_items.id and sio.organisation_id = public.my_organisation_id()
      )
    )
  )
);

drop policy if exists "members see only own targeting" on public.schedule_item_organisations;
create policy "members and observers see schedule targeting" on public.schedule_item_organisations for select to authenticated using (
  public.is_lvnc_admin() or public.is_partner_observer() or organisation_id = public.my_organisation_id()
);

-- Explicitly prevent the observer role from using the startup write paths.
drop policy if exists "members insert own responses" on public.event_responses;
create policy "startup members insert own responses" on public.event_responses for insert to authenticated with check (
  public.is_lvnc_admin() or (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'startup_member')
    and organisation_id = public.my_organisation_id() and updated_by = auth.uid()
    and exists (select 1 from public.schedule_items si where si.id = schedule_item_id)
  )
);
drop policy if exists "members update own responses" on public.event_responses;
create policy "startup members update own responses" on public.event_responses for update to authenticated using (
  public.is_lvnc_admin() or (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'startup_member')
    and organisation_id = public.my_organisation_id()
  )
) with check (public.is_lvnc_admin() or (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'startup_member')
  and organisation_id = public.my_organisation_id() and updated_by = auth.uid()
));
drop policy if exists "members add own availability" on public.availability_blocks;
create policy "startup members add own availability" on public.availability_blocks for insert to authenticated with check (
  public.is_lvnc_admin() or (exists (select 1 from public.profiles where id = auth.uid() and role = 'startup_member') and organisation_id = public.my_organisation_id() and created_by = auth.uid())
);
drop policy if exists "members update own availability" on public.availability_blocks;
create policy "startup members update own availability" on public.availability_blocks for update to authenticated using (
  public.is_lvnc_admin() or (exists (select 1 from public.profiles where id = auth.uid() and role = 'startup_member') and organisation_id = public.my_organisation_id())
) with check (public.is_lvnc_admin() or (exists (select 1 from public.profiles where id = auth.uid() and role = 'startup_member') and organisation_id = public.my_organisation_id()));
drop policy if exists "members delete own availability" on public.availability_blocks;
create policy "startup members delete own availability" on public.availability_blocks for delete to authenticated using (
  public.is_lvnc_admin() or (exists (select 1 from public.profiles where id = auth.uid() and role = 'startup_member') and organisation_id = public.my_organisation_id())
);
drop policy if exists "startup manages own potential meeting decision" on public.potential_meeting_decisions;
create policy "startup members manage own potential meeting decision" on public.potential_meeting_decisions for all to authenticated using (
  public.is_lvnc_admin() or (exists (select 1 from public.profiles where id = auth.uid() and role = 'startup_member') and exists (select 1 from public.potential_meetings pm where pm.id = potential_meeting_id and pm.organisation_id = public.my_organisation_id()))
) with check (
  public.is_lvnc_admin() or (exists (select 1 from public.profiles where id = auth.uid() and role = 'startup_member') and exists (select 1 from public.potential_meetings pm where pm.id = potential_meeting_id and pm.organisation_id = public.my_organisation_id()))
);

alter table public.potential_meeting_decisions
  add column if not exists priority_rating smallint check (priority_rating between 1 and 3);

-- Update all existing PEN Ventures invitations and already-provisioned users.
update public.allowed_invites
set role = 'partner_observer'
where organisation_id = (select id from public.organisations where slug = 'pen-ventures');
update public.profiles
set role = 'partner_observer'
where organisation_id = (select id from public.organisations where slug = 'pen-ventures');
