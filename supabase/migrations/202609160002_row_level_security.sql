alter table public.organisations enable row level security;
alter table public.allowed_invites enable row level security;
alter table public.profiles enable row level security;
alter table public.schedule_items enable row level security;
alter table public.schedule_item_organisations enable row level security;
alter table public.conflict_groups enable row level security;
alter table public.schedule_item_conflict_groups enable row level security;
alter table public.event_responses enable row level security;
alter table public.availability_blocks enable row level security;

create policy "authenticated users see organisation names" on public.organisations for select to authenticated using (public.is_lvnc_admin() or id = public.my_organisation_id());
create policy "admins manage organisations" on public.organisations for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());

create policy "admins manage invites" on public.allowed_invites for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());

create policy "users see own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.is_lvnc_admin());
create policy "admins manage profiles" on public.profiles for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());

create policy "members see allowed schedule items" on public.schedule_items for select to authenticated using (
  public.is_lvnc_admin() or (
    ((item_type = 'lvnc_core' and status = 'confirmed') or (item_type <> 'lvnc_core' and status in ('proposed', 'confirmed'))) and (
      visibility_scope = 'cohort' or exists (
        select 1 from public.schedule_item_organisations sio
        where sio.schedule_item_id = schedule_items.id and sio.organisation_id = public.my_organisation_id()
      )
    )
  )
);
create policy "admins manage schedule items" on public.schedule_items for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());

create policy "members see only own targeting" on public.schedule_item_organisations for select to authenticated using (public.is_lvnc_admin() or organisation_id = public.my_organisation_id());
create policy "admins manage targeting" on public.schedule_item_organisations for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());

create policy "visible conflict groups" on public.conflict_groups for select to authenticated using (
  public.is_lvnc_admin() or exists (
    select 1 from public.schedule_item_conflict_groups sicg join public.schedule_items si on si.id = sicg.schedule_item_id
    where sicg.conflict_group_id = conflict_groups.id
  )
);
create policy "admins manage conflict groups" on public.conflict_groups for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());
create policy "visible conflict memberships" on public.schedule_item_conflict_groups for select to authenticated using (
  public.is_lvnc_admin() or exists (select 1 from public.schedule_items si where si.id = schedule_item_id)
);
create policy "admins manage conflict memberships" on public.schedule_item_conflict_groups for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());

create policy "members see own responses" on public.event_responses for select to authenticated using (public.is_lvnc_admin() or organisation_id = public.my_organisation_id());
create policy "members insert own responses" on public.event_responses for insert to authenticated with check (
  public.is_lvnc_admin() or (organisation_id = public.my_organisation_id() and updated_by = auth.uid() and exists (select 1 from public.schedule_items si where si.id = schedule_item_id))
);
create policy "members update own responses" on public.event_responses for update to authenticated using (public.is_lvnc_admin() or organisation_id = public.my_organisation_id()) with check (
  public.is_lvnc_admin() or (organisation_id = public.my_organisation_id() and updated_by = auth.uid())
);
create policy "admins delete responses" on public.event_responses for delete to authenticated using (public.is_lvnc_admin());

create policy "members see own availability" on public.availability_blocks for select to authenticated using (public.is_lvnc_admin() or organisation_id = public.my_organisation_id());
create policy "members add own availability" on public.availability_blocks for insert to authenticated with check (public.is_lvnc_admin() or (organisation_id = public.my_organisation_id() and created_by = auth.uid()));
create policy "members update own availability" on public.availability_blocks for update to authenticated using (public.is_lvnc_admin() or organisation_id = public.my_organisation_id()) with check (public.is_lvnc_admin() or organisation_id = public.my_organisation_id());
create policy "members delete own availability" on public.availability_blocks for delete to authenticated using (public.is_lvnc_admin() or organisation_id = public.my_organisation_id());

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select on public.organisations, public.profiles, public.schedule_items, public.schedule_item_organisations, public.conflict_groups, public.schedule_item_conflict_groups to authenticated;
grant select, insert, update, delete on public.event_responses, public.availability_blocks to authenticated;
grant all on public.organisations, public.allowed_invites, public.profiles, public.schedule_items, public.schedule_item_organisations, public.conflict_groups, public.schedule_item_conflict_groups to authenticated;
