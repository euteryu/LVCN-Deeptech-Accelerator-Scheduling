-- Adds Hotel Recs to the existing startup-section visibility controls.
alter table public.app_section_visibility
  drop constraint if exists app_section_visibility_section_id_check;

alter table public.app_section_visibility
  add constraint app_section_visibility_section_id_check
  check (section_id in ('calendar', 'business-meetings', 'decisions', 'location', 'hotel-recs', 'toilets', 'external-events'));

-- Hotel Recs is available to every startup by default. Admins can later
-- change this row through the sidebar visibility control.
insert into public.app_section_visibility (section_id, visible_to_startups)
values ('hotel-recs', true)
on conflict (section_id) do update set visible_to_startups = true;
