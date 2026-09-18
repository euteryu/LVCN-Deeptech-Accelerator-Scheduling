-- Expose the startup-facing relevance explanation as a first-class column.
-- Safe to rerun; admins control whether startups see it.
alter table public.business_meeting_column_visibility
  drop constraint if exists business_meeting_column_visibility_column_id_check;

alter table public.business_meeting_column_visibility
  add constraint business_meeting_column_visibility_column_id_check
  check (column_id in ('institution', 'startup', 'category', 'decision', 'status', 'person', 'email', 'time', 'note', 'why', 'next'));

insert into public.business_meeting_column_visibility (column_id, visible_to_startups)
values ('why', true), ('next', true)
on conflict (column_id) do nothing;

-- Give older records a useful, honest baseline instead of leaving empty cells.
-- Admins can replace these short defaults with company-specific wording.
update public.potential_meetings
set startup_visible_note = coalesce(nullif(trim(startup_visible_note), ''),
  'A potential ' || lower(coalesce(category, 'relationship')) || ' connection that may help with customer discovery, partnerships, funding or domain insight.'),
    next_action = coalesce(nullif(trim(next_action), ''),
  'LVCN to confirm the right contact and arrange an introductory conversation if the startup is interested.')
where nullif(trim(startup_visible_note), '') is null
   or nullif(trim(next_action), '') is null;
