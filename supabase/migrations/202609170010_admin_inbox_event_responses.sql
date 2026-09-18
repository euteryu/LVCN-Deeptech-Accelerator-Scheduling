-- Startup schedule decisions and optional private messages enter the LVCN inbox.
alter table public.event_responses
  add column if not exists admin_reviewed_at timestamptz,
  add column if not exists admin_reviewed_by uuid references public.profiles(id) on delete set null;

create index if not exists event_responses_admin_inbox_idx
  on public.event_responses (admin_reviewed_at)
  where admin_reviewed_at is null;
