-- Preserve researched schedule items while allowing LVCN to mark that a
-- particular startup is not attending during its programme window.

create table if not exists public.schedule_item_participation (
  schedule_item_id uuid not null references public.schedule_items(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  status text not null default 'expected' check (status in ('expected', 'not_attending')),
  attendees text,
  attendance_starts_on date,
  attendance_ends_on date,
  admin_note text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (schedule_item_id, organisation_id)
);

-- Safe for databases where the initial version of this migration was already
-- applied before the private coordination fields were added.
alter table public.schedule_item_participation
  add column if not exists attendees text,
  add column if not exists attendance_starts_on date,
  add column if not exists attendance_ends_on date,
  add column if not exists admin_note text;

create index if not exists schedule_item_participation_org_idx
  on public.schedule_item_participation (organisation_id, status);

alter table public.schedule_item_participation enable row level security;

drop policy if exists "admins manage schedule participation" on public.schedule_item_participation;
create policy "admins manage schedule participation"
  on public.schedule_item_participation for all to authenticated
  using (public.is_lvnc_admin())
  with check (public.is_lvnc_admin());

drop policy if exists "startups see own schedule participation" on public.schedule_item_participation;
create policy "startups see own schedule participation"
  on public.schedule_item_participation for select to authenticated
  using (organisation_id = public.my_organisation_id());
