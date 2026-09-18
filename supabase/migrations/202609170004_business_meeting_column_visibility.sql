-- Lets LVCN decide which Potential Biz Meets table columns startup accounts see.
-- Admins always retain the complete coordination view.
create table if not exists public.business_meeting_column_visibility (
  column_id text primary key check (column_id in ('institution', 'category', 'decision', 'status', 'person', 'time', 'note')),
  visible_to_startups boolean not null default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- Preserve the existing privacy default: the named contact is administrator-only.
insert into public.business_meeting_column_visibility (column_id, visible_to_startups)
values
  ('institution', true),
  ('category', true),
  ('decision', true),
  ('status', true),
  ('person', false),
  ('time', true),
  ('note', true)
on conflict (column_id) do nothing;

drop trigger if exists business_meeting_column_visibility_updated on public.business_meeting_column_visibility;

create trigger business_meeting_column_visibility_updated
before update on public.business_meeting_column_visibility
for each row execute function public.set_updated_at();

alter table public.business_meeting_column_visibility enable row level security;

drop policy if exists "authenticated users see business meeting column visibility" on public.business_meeting_column_visibility;
create policy "authenticated users see business meeting column visibility"
on public.business_meeting_column_visibility for select to authenticated using (true);

drop policy if exists "admins manage business meeting column visibility" on public.business_meeting_column_visibility;
create policy "admins manage business meeting column visibility"
on public.business_meeting_column_visibility for all to authenticated
using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());
