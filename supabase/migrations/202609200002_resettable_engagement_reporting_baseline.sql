-- Engagement is an operational metric, not an audit deletion. Keep the raw
-- access events intact, but establish a reporting baseline so LVCN can start
-- a clean measurement period whenever required.

create table if not exists public.engagement_reporting_baseline (
  singleton boolean primary key default true check (singleton),
  reset_at timestamptz not null default now(),
  reset_by uuid references auth.users(id) on delete set null
);

-- Applying this migration starts the new reporting period without deleting
-- historical records. A later admin reset updates this same singleton row.
insert into public.engagement_reporting_baseline (singleton)
values (true)
on conflict (singleton) do nothing;

alter table public.engagement_reporting_baseline enable row level security;

drop policy if exists "admins see engagement reporting baseline" on public.engagement_reporting_baseline;
create policy "admins see engagement reporting baseline"
  on public.engagement_reporting_baseline for select to authenticated
  using (public.is_lvnc_admin());

drop policy if exists "admins update engagement reporting baseline" on public.engagement_reporting_baseline;
create policy "admins update engagement reporting baseline"
  on public.engagement_reporting_baseline for all to authenticated
  using (public.is_lvnc_admin())
  with check (public.is_lvnc_admin());

revoke all on public.engagement_reporting_baseline from anon;
grant select, insert, update on public.engagement_reporting_baseline to authenticated;
