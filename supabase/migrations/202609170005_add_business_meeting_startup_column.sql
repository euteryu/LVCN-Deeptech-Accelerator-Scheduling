-- Adds the admin-only Startup column to Potential Biz Meets table visibility.
alter table public.business_meeting_column_visibility
  drop constraint if exists business_meeting_column_visibility_column_id_check;

alter table public.business_meeting_column_visibility
  add constraint business_meeting_column_visibility_column_id_check
  check (column_id in ('institution', 'startup', 'category', 'decision', 'status', 'person', 'time', 'note'));

insert into public.business_meeting_column_visibility (column_id, visible_to_startups)
values ('startup', false)
on conflict (column_id) do nothing;
