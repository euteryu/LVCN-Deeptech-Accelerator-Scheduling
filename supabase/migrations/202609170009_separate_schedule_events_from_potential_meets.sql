-- Schedule pages are for dated programme events only. Potential Biz Meets live
-- exclusively in public.potential_meetings and are never returned by this view.
create or replace view public.schedule_events
with (security_invoker = true) as
select *
from public.schedule_items
where item_type <> 'business_meeting'
  and starts_at is not null
  and status <> 'cancelled';

-- Decision semantics used by the four schedule-filter choices:
-- confirmed = going/acknowledged; rejected = every response is pass;
-- pending = no response, undecided, or a mixed audience response set.
