-- Adds Hotel Recs to the existing startup-section visibility controls.
alter table public.app_section_visibility
  drop constraint if exists app_section_visibility_section_id_check;

alter table public.app_section_visibility
  add constraint app_section_visibility_section_id_check
  check (section_id in ('calendar', 'business-meetings', 'decisions', 'location', 'hotel-recs', 'toilets', 'external-events'));
