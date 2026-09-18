-- Availability changes need the same one-time admin review workflow as
-- decisions and messages. The note itself remains visible only to LVCN.
alter table public.availability_blocks
  add column if not exists admin_reviewed_at timestamptz,
  add column if not exists admin_reviewed_by uuid references public.profiles(id) on delete set null;

create index if not exists availability_blocks_admin_inbox_idx
  on public.availability_blocks (admin_reviewed_at)
  where admin_reviewed_at is null;
