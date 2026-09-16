-- Recipient directory for future grouped schedule notifications.
-- Existing allow-listed contacts are loaded once, but notifications remain off
-- until a verified sender and digest function are configured.

create table if not exists public.notification_recipients (
  email text primary key references public.allowed_invites(email) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete cascade,
  full_name text,
  is_lvnc_admin boolean not null default false,
  is_schedule_poc boolean not null default false,
  receives_digest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.notification_recipients (email, organisation_id, full_name, is_lvnc_admin)
select email, organisation_id, full_name, role = 'lvnc_admin'
from public.allowed_invites
on conflict (email) do update set
  organisation_id = excluded.organisation_id,
  full_name = excluded.full_name,
  is_lvnc_admin = excluded.is_lvnc_admin,
  updated_at = now();

alter table public.notification_recipients enable row level security;
drop policy if exists "admins manage notification recipients" on public.notification_recipients;
create policy "admins manage notification recipients" on public.notification_recipients for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());
revoke all on public.notification_recipients from anon;
grant select, insert, update, delete on public.notification_recipients to authenticated;
