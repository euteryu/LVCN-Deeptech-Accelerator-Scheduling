-- Keep LVCN moderator access in Cohort Retention without assigning moderators
-- to a startup organisation. Startup member events remain organisation-scoped.

alter table public.app_activity_events
  alter column organisation_id drop not null;

drop policy if exists "members record own organisation session" on public.app_activity_events;

create policy "members and admins record own session"
  on public.app_activity_events for insert to authenticated
  with check (
    actor_id = auth.uid()
    and (
      organisation_id = public.my_organisation_id()
      or (organisation_id is null and public.is_lvnc_admin())
    )
  );
