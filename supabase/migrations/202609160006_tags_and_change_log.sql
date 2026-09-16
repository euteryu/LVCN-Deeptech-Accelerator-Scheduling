-- Controlled schedule tags and a notification-ready audit trail.
-- This records edits now; outbound digest email is enabled separately once
-- recipient POCs and a verified LVCN sender are configured.

alter table public.schedule_items
  add column if not exists tags text[] not null default '{}';

alter table public.schedule_items
  drop constraint if exists schedule_items_tags_allowed;

alter table public.schedule_items
  add constraint schedule_items_tags_allowed check (
    tags <@ array['Fintech', 'Medtech', 'AI', 'Investor', 'Enterprise', 'Workshop', 'Networking', 'Site visit']::text[]
  );

create table if not exists public.change_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('schedule_item', 'event_response', 'availability_block')),
  action text not null check (action in ('created', 'updated', 'deleted')),
  record_id uuid not null,
  organisation_id uuid references public.organisations(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

create index if not exists change_log_occurred_at_idx on public.change_log(occurred_at desc);
create index if not exists change_log_organisation_idx on public.change_log(organisation_id, occurred_at desc);

create or replace function public.log_programme_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  record jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  kind text := case tg_table_name when 'schedule_items' then 'schedule_item' when 'event_responses' then 'event_response' else 'availability_block' end;
  affected_organisation uuid := null;
begin
  if tg_table_name in ('event_responses', 'availability_blocks') then
    affected_organisation := (record ->> 'organisation_id')::uuid;
  end if;

  insert into public.change_log (entity_type, action, record_id, organisation_id, actor_id, details)
  values (kind, case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end, (record ->> 'id')::uuid, affected_organisation, auth.uid(), record);
  return coalesce(new, old);
end;
$$;

drop trigger if exists schedule_item_change_log on public.schedule_items;
create trigger schedule_item_change_log after insert or update or delete on public.schedule_items for each row execute function public.log_programme_change();
drop trigger if exists event_response_change_log on public.event_responses;
create trigger event_response_change_log after insert or update or delete on public.event_responses for each row execute function public.log_programme_change();
drop trigger if exists availability_change_log on public.availability_blocks;
create trigger availability_change_log after insert or update or delete on public.availability_blocks for each row execute function public.log_programme_change();

alter table public.change_log enable row level security;
drop policy if exists "admins see programme changes" on public.change_log;
create policy "admins see programme changes" on public.change_log for select to authenticated using (public.is_lvnc_admin());
revoke all on public.change_log from anon;
grant select on public.change_log to authenticated;
