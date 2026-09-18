alter table public.schedule_items add column if not exists contact_email text;

alter table public.business_meeting_column_visibility
  drop constraint if exists business_meeting_column_visibility_column_id_check;

alter table public.business_meeting_column_visibility
  add constraint business_meeting_column_visibility_column_id_check
  check (column_id in ('institution', 'startup', 'category', 'decision', 'status', 'person', 'email', 'time', 'note'));

insert into public.business_meeting_column_visibility (column_id, visible_to_startups)
values ('email', false)
on conflict (column_id) do nothing;
