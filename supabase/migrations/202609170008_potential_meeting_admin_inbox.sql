-- A startup decision becomes an explicit, auditable action for LVCN.
alter table public.potential_meeting_decisions
  add column if not exists admin_reviewed_at timestamptz,
  add column if not exists admin_reviewed_by uuid references public.profiles(id) on delete set null;

create index if not exists potential_meeting_decisions_admin_inbox_idx
  on public.potential_meeting_decisions (admin_reviewed_at)
  where admin_reviewed_at is null;
