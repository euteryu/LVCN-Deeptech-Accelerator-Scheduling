-- Flexible attendance plans and a durable, two-way schedule conversation.
-- Run this manually in the Supabase SQL Editor before deploying the UI.

alter table public.event_responses
  add column if not exists attendance_plan text not null default 'not_set'
    check (attendance_plan in ('not_set', 'full_event', 'morning', 'afternoon', 'evening', 'custom_time')),
  add column if not exists attendance_starts_at timestamptz,
  add column if not exists attendance_ends_at timestamptz,
  add column if not exists conversation_status text not null default 'none'
    check (conversation_status in ('none', 'awaiting_admin', 'awaiting_startup', 'resolved')),
  add column if not exists admin_response_status text
    check (admin_response_status is null or admin_response_status in ('approved', 'needs_details', 'not_possible', 'information')),
  add column if not exists admin_replied_at timestamptz,
  add column if not exists admin_replied_by uuid references public.profiles(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'event_responses_attendance_range_check'
      and conrelid = 'public.event_responses'::regclass
  ) then
    alter table public.event_responses add constraint event_responses_attendance_range_check
      check (attendance_ends_at is null or attendance_starts_at is null or attendance_ends_at > attendance_starts_at);
  end if;
end;
$$;

create table if not exists public.event_response_messages (
  id uuid primary key default gen_random_uuid(),
  event_response_id uuid not null references public.event_responses(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 3000),
  author_id uuid not null references public.profiles(id) on delete restrict,
  author_role public.app_role not null,
  created_at timestamptz not null default now()
);

create index if not exists event_response_messages_response_created_idx
  on public.event_response_messages (event_response_id, created_at);

alter table public.event_response_messages enable row level security;
drop policy if exists "admins see schedule conversation messages" on public.event_response_messages;
create policy "admins see schedule conversation messages" on public.event_response_messages
  for select to authenticated using (public.is_lvnc_admin());
drop policy if exists "startups see own schedule conversation messages" on public.event_response_messages;
create policy "startups see own schedule conversation messages" on public.event_response_messages
  for select to authenticated using (
    exists (
      select 1 from public.event_responses response
      where response.id = event_response_id
        and response.organisation_id = public.my_organisation_id()
    )
  );
drop policy if exists "admins send schedule conversation messages" on public.event_response_messages;
create policy "admins send schedule conversation messages" on public.event_response_messages
  for insert to authenticated with check (
    public.is_lvnc_admin() and author_id = auth.uid() and author_role = 'lvnc_admin'
  );
drop policy if exists "startups send own schedule conversation messages" on public.event_response_messages;
create policy "startups send own schedule conversation messages" on public.event_response_messages
  for insert to authenticated with check (
    author_id = auth.uid() and author_role = 'startup_member' and exists (
      select 1 from public.event_responses response
      where response.id = event_response_id
        and response.organisation_id = public.my_organisation_id()
    )
  );
revoke all on public.event_response_messages from anon;
grant select, insert on public.event_response_messages to authenticated;

-- A startup update always re-opens the conversation for LVCN. This prevents a
-- stale "resolved" state from hiding a later question or changed attendance plan.
create or replace function public.reopen_schedule_conversation_for_startup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.author_role = 'startup_member' then
    update public.event_responses
      set conversation_status = 'awaiting_admin',
          admin_reviewed_at = null,
          admin_reviewed_by = null
    where id = new.event_response_id;
  end if;
  return new;
end;
$$;

drop trigger if exists event_response_message_reopens_conversation on public.event_response_messages;
create trigger event_response_message_reopens_conversation
  after insert on public.event_response_messages
  for each row execute function public.reopen_schedule_conversation_for_startup();
