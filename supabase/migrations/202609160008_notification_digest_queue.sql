-- Notification digest queue. No email is sent by this migration.
-- A future scheduled function will claim rows once a verified sender exists.

create table if not exists public.notification_digest_queue (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null references public.notification_recipients(email) on delete cascade,
  change_log_id uuid not null references public.change_log(id) on delete cascade,
  deliver_after timestamptz not null default (now() + interval '5 minutes'),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_email, change_log_id)
);

create index if not exists notification_digest_pending_idx on public.notification_digest_queue(deliver_after) where delivered_at is null;

alter table public.notification_digest_queue enable row level security;
drop policy if exists "admins see notification queue" on public.notification_digest_queue;
create policy "admins see notification queue" on public.notification_digest_queue for select to authenticated using (public.is_lvnc_admin());
revoke all on public.notification_digest_queue from anon;
grant select on public.notification_digest_queue to authenticated;
