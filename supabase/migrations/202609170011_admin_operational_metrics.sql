-- Operational signals for the LVCN admin hub. These record meaningful use,
-- not clicks or keystrokes, and are visible only to LVCN administrators.

alter table public.schedule_items
  add column if not exists review_by date;

create index if not exists schedule_items_review_by_idx
  on public.schedule_items (review_by)
  where review_by is not null and status <> 'cancelled';

create table if not exists public.app_activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  event_type text not null check (event_type in ('session_started')),
  occurred_at timestamptz not null default now()
);

create index if not exists app_activity_events_org_time_idx
  on public.app_activity_events (organisation_id, occurred_at desc);

alter table public.app_activity_events enable row level security;

create policy "admins see engagement activity"
  on public.app_activity_events for select to authenticated
  using (public.is_lvnc_admin());

create policy "members record own organisation session"
  on public.app_activity_events for insert to authenticated
  with check (actor_id = auth.uid() and organisation_id = public.my_organisation_id());

revoke all on public.app_activity_events from anon;
grant select, insert on public.app_activity_events to authenticated;
