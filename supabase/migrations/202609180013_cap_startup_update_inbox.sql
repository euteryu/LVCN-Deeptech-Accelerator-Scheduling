-- Startup Updates are an action inbox, not an unbounded activity archive.
-- Retain the 30 newest unread updates per startup and archive older ones by
-- marking them read. Records remain available for LVCN audit purposes.
with ranked as (
  select id, row_number() over (
    partition by organisation_id order by created_at desc, id desc
  ) as position
  from public.startup_updates
  where read_at is null
)
update public.startup_updates update_row
set read_at = now()
from ranked
where update_row.id = ranked.id
  and ranked.position > 30;

create or replace function public.cap_startup_update_inbox()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.startup_updates update_row
  set read_at = now()
  where update_row.id in (
    select id
    from public.startup_updates
    where organisation_id = new.organisation_id
      and read_at is null
    order by created_at desc, id desc
    offset 30
  );
  return new;
end;
$$;

drop trigger if exists startup_updates_inbox_cap on public.startup_updates;
create trigger startup_updates_inbox_cap
after insert on public.startup_updates
for each row execute function public.cap_startup_update_inbox();
