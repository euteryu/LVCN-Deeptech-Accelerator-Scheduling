-- Protect all schedule-item writers (startup proposals, admin edits, imports
-- and direct API requests) from an end time that is equal to or earlier than
-- its start time. The original check constraint remains the final safeguard.
create or replace function public.normalise_schedule_item_time_range()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.starts_at is not null
     and (new.ends_at is null or new.ends_at <= new.starts_at) then
    new.ends_at := new.starts_at + interval '1 hour';
  end if;
  return new;
end;
$$;

drop trigger if exists schedule_items_normalise_time_range on public.schedule_items;
create trigger schedule_items_normalise_time_range
before insert or update on public.schedule_items
for each row execute function public.normalise_schedule_item_time_range();
