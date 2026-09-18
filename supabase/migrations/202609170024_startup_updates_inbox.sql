-- Versioned, in-app communications for startups. Run manually in Supabase
-- after the application deployment. The app degrades safely until this exists.

create table if not exists public.startup_updates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  kind text not null check (kind in ('schedule', 'potential_biz_meet', 'admin_message')),
  title text not null check (char_length(trim(title)) between 1 and 240),
  body text,
  schedule_item_id uuid references public.schedule_items(id) on delete set null,
  potential_meeting_id uuid references public.potential_meetings(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists startup_updates_org_created_idx on public.startup_updates (organisation_id, created_at desc);

alter table public.startup_updates enable row level security;
drop policy if exists "admins see startup updates" on public.startup_updates;
create policy "admins see startup updates" on public.startup_updates for select to authenticated using (public.is_lvnc_admin());
drop policy if exists "startups see their updates" on public.startup_updates;
create policy "startups see their updates" on public.startup_updates for select to authenticated using (organisation_id = public.my_organisation_id());
drop policy if exists "admins send startup updates" on public.startup_updates;
create policy "admins send startup updates" on public.startup_updates for insert to authenticated with check (public.is_lvnc_admin());
drop policy if exists "startups mark own updates read" on public.startup_updates;
create policy "startups mark own updates read" on public.startup_updates for update to authenticated using (organisation_id = public.my_organisation_id()) with check (organisation_id = public.my_organisation_id());
revoke all on public.startup_updates from anon;
grant select, insert on public.startup_updates to authenticated;
grant update(read_at) on public.startup_updates to authenticated;

create or replace function public.publish_startup_update(
  target_organisation uuid, update_kind text, update_title text, update_body text,
  item_id uuid default null, meeting_id uuid default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.startup_updates (organisation_id, kind, title, body, schedule_item_id, potential_meeting_id, created_by)
  values (target_organisation, update_kind, update_title, nullif(update_body, ''), item_id, meeting_id, auth.uid());
end;
$$;

create or replace function public.notify_schedule_item_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target record; heading text; detail text;
begin
  if tg_op = 'UPDATE' and new.title is not distinct from old.title and new.starts_at is not distinct from old.starts_at
    and new.ends_at is not distinct from old.ends_at and new.location is not distinct from old.location
    and new.status is not distinct from old.status and new.description is not distinct from old.description then
    return new;
  end if;
  heading := case when tg_op = 'INSERT' then 'New schedule item: ' || new.title
    when new.status = 'cancelled' then 'Cancelled: ' || new.title
    when new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at then 'Schedule time changed: ' || new.title
    else 'Schedule updated: ' || new.title end;
  detail := coalesce(new.description, case when new.status = 'cancelled' then 'This item has been removed from your live schedule.' else 'Open your schedule to review the latest details.' end);
  for target in
    select distinct organisation_id from public.schedule_item_organisations where schedule_item_id = new.id
    union
    select distinct p.organisation_id from public.profiles p where new.visibility_scope = 'cohort' and p.role = 'startup_member' and p.organisation_id is not null
  loop
    perform public.publish_startup_update(target.organisation_id, 'schedule', heading, detail, new.id, null);
  end loop;
  return new;
end;
$$;

drop trigger if exists schedule_item_startup_updates on public.schedule_items;
create trigger schedule_item_startup_updates after insert or update on public.schedule_items for each row execute function public.notify_schedule_item_change();

create or replace function public.notify_schedule_target_added() returns trigger
language plpgsql security definer set search_path = '' as $$
declare item record;
begin
  select * into item from public.schedule_items where id = new.schedule_item_id;
  if found then
    perform public.publish_startup_update(new.organisation_id, 'schedule', 'New schedule item: ' || item.title, coalesce(item.description, 'Open your schedule to review the details.'), item.id, null);
  end if;
  return new;
end;
$$;

drop trigger if exists schedule_target_startup_updates on public.schedule_item_organisations;
create trigger schedule_target_startup_updates after insert on public.schedule_item_organisations for each row execute function public.notify_schedule_target_added();

create or replace function public.notify_potential_meeting_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare heading text; detail text;
begin
  if tg_op = 'UPDATE' and new.institution_name is not distinct from old.institution_name
    and new.status is not distinct from old.status and new.proposed_starts_at is not distinct from old.proposed_starts_at
    and new.proposed_ends_at is not distinct from old.proposed_ends_at and new.location is not distinct from old.location
    and new.startup_visible_note is not distinct from old.startup_visible_note and new.next_action is not distinct from old.next_action then
    return new;
  end if;
  heading := case when tg_op = 'INSERT' then 'New Potential Biz Meet: ' || new.institution_name
    when new.status = 'rejected' then 'Potential Biz Meet closed: ' || new.institution_name
    when new.proposed_starts_at is distinct from old.proposed_starts_at or new.proposed_ends_at is distinct from old.proposed_ends_at then 'Potential Biz Meet time changed: ' || new.institution_name
    else 'Potential Biz Meet updated: ' || new.institution_name end;
  detail := coalesce(new.startup_visible_note, new.next_action, 'Open Potential Biz Meets to review the latest details.');
  perform public.publish_startup_update(new.organisation_id, 'potential_biz_meet', heading, detail, null, new.id);
  return new;
end;
$$;

drop trigger if exists potential_meeting_startup_updates on public.potential_meetings;
create trigger potential_meeting_startup_updates after insert or update on public.potential_meetings for each row execute function public.notify_potential_meeting_change();
