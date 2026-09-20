-- Attendance exceptions are startup-visible, but the names, travel dates and
-- coordination notes behind them are for LVCN administrators only.
create table if not exists public.schedule_item_participation_admin_details (
  schedule_item_id uuid not null,
  organisation_id uuid not null,
  attendees text,
  attendance_starts_on date,
  attendance_ends_on date,
  admin_note text,
  updated_at timestamptz not null default now(),
  primary key (schedule_item_id, organisation_id),
  foreign key (schedule_item_id, organisation_id)
    references public.schedule_item_participation (schedule_item_id, organisation_id)
    on delete cascade
);

alter table public.schedule_item_participation_admin_details enable row level security;

drop policy if exists "admins manage private schedule participation details" on public.schedule_item_participation_admin_details;
create policy "admins manage private schedule participation details"
  on public.schedule_item_participation_admin_details for all to authenticated
  using (public.is_lvnc_admin())
  with check (public.is_lvnc_admin());

-- Move any data written by the initial implementation, then remove the
-- private columns from the startup-readable participation table.
insert into public.schedule_item_participation_admin_details
  (schedule_item_id, organisation_id, attendees, attendance_starts_on, attendance_ends_on, admin_note)
select schedule_item_id, organisation_id, attendees, attendance_starts_on, attendance_ends_on, admin_note
from public.schedule_item_participation
where attendees is not null
   or attendance_starts_on is not null
   or attendance_ends_on is not null
   or admin_note is not null
on conflict (schedule_item_id, organisation_id) do update set
  attendees = excluded.attendees,
  attendance_starts_on = excluded.attendance_starts_on,
  attendance_ends_on = excluded.attendance_ends_on,
  admin_note = excluded.admin_note,
  updated_at = now();

alter table public.schedule_item_participation
  drop column if exists attendees,
  drop column if exists attendance_starts_on,
  drop column if exists attendance_ends_on,
  drop column if exists admin_note;
