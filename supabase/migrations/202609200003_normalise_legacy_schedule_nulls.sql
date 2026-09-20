-- Early imports sometimes persisted optional values as the literal strings
-- "null"/"undefined". Convert them to SQL NULL so forms and exports treat
-- those fields as genuinely absent.
update public.schedule_items
set event_url = null
where event_url is not null
  and lower(trim(event_url)) in ('null', 'undefined');

update public.schedule_items
set registration_deadline = null
where registration_deadline is not null
  and lower(trim(registration_deadline::text)) in ('null', 'undefined');

update public.schedule_items
set review_by = null
where review_by is not null
  and lower(trim(review_by::text)) in ('null', 'undefined');
