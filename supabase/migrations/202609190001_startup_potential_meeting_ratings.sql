-- Startup members use the compact priority-rating view for Potential Biz Meets.
-- Admins still retain the complete decision and coordination view.
alter table public.business_meeting_column_visibility
  drop constraint if exists business_meeting_column_visibility_column_id_check;

-- Older deployments may contain legacy visibility IDs that are no longer
-- rendered by the Potential Biz Meets table. Keep supported settings and
-- remove only those orphaned configuration rows before restoring the check.
delete from public.business_meeting_column_visibility
where column_id not in ('institution', 'startup', 'category', 'decision', 'status', 'person', 'email', 'time', 'note', 'priority', 'why', 'next');

alter table public.business_meeting_column_visibility
  add constraint business_meeting_column_visibility_column_id_check
  check (column_id in ('institution', 'startup', 'category', 'decision', 'status', 'person', 'email', 'time', 'note', 'priority', 'why', 'next'))
  not valid;

insert into public.business_meeting_column_visibility (column_id, visible_to_startups)
values ('priority', true)
on conflict (column_id) do update set visible_to_startups = excluded.visible_to_startups;

update public.business_meeting_column_visibility
set visible_to_startups = false
where column_id = 'decision';
