-- Move the pre-separation Potential Biz Meet records out of schedule_items.
-- schedule_events deliberately excludes these rows, so retaining them there
-- alone makes historical company opportunities disappear from the new page.
alter table public.potential_meetings
  add column if not exists legacy_schedule_item_id uuid references public.schedule_items(id) on delete set null;

create unique index if not exists potential_meetings_legacy_schedule_organisation_idx
  on public.potential_meetings (legacy_schedule_item_id, organisation_id)
  where legacy_schedule_item_id is not null;

insert into public.potential_meetings (
  organisation_id,
  institution_name,
  category,
  status,
  proposed_starts_at,
  proposed_ends_at,
  location,
  external_url,
  startup_visible_note,
  next_action,
  created_by,
  legacy_schedule_item_id
)
select
  target.organisation_id,
  item.title,
  coalesce(nullif(item.meeting_category, ''), 'Other'),
  case lower(coalesce(item.meeting_status, ''))
    when 'agreed' then 'agreed'::public.potential_meeting_status
    when 'rejected' then 'rejected'::public.potential_meeting_status
    when 'paused' then 'paused'::public.potential_meeting_status
    else 'contacted'::public.potential_meeting_status
  end,
  item.starts_at,
  item.ends_at,
  item.location,
  coalesce(item.event_url, item.meeting_link),
  nullif(item.meeting_note, ''),
  item.next_action,
  item.created_by,
  item.id
from public.schedule_items item
join public.schedule_item_organisations target on target.schedule_item_id = item.id
where item.item_type = 'business_meeting'
  and not exists (
    select 1
    from public.potential_meetings existing
    where existing.legacy_schedule_item_id = item.id
      and existing.organisation_id = target.organisation_id
  );

insert into public.potential_meeting_admin_details (
  potential_meeting_id,
  contact_name,
  contact_email,
  internal_note,
  updated_by
)
select
  potential.id,
  item.contact_name,
  item.contact_email,
  nullif(item.source_note, ''),
  item.created_by
from public.potential_meetings potential
join public.schedule_items item on item.id = potential.legacy_schedule_item_id
where (item.contact_name is not null or item.contact_email is not null or item.source_note is not null)
on conflict (potential_meeting_id) do nothing;

insert into public.potential_meeting_decisions (
  potential_meeting_id,
  decision,
  note,
  updated_by,
  updated_at
)
select
  potential.id,
  response.decision,
  response.note,
  coalesce(response.updated_by, item.created_by),
  response.updated_at
from public.potential_meetings potential
join public.schedule_items item on item.id = potential.legacy_schedule_item_id
join public.event_responses response
  on response.schedule_item_id = item.id
 and response.organisation_id = potential.organisation_id
where response.decision <> 'undecided'
on conflict (potential_meeting_id) do nothing;

-- These were early generic placeholders, not meaningful opportunities.
delete from public.potential_meetings
where lower(institution_name) in ('business meetings (morning)', 'business meetings (afternoon)');

delete from public.schedule_items
where item_type = 'business_meeting'
  and (lower(title) in ('business meetings (morning)', 'business meetings (afternoon)')
       or lower(title) like 'busines%meetings%');

-- These are dated conferences/networking events, not one-to-one prospects.
with misfiled as (
  select legacy_schedule_item_id
  from public.potential_meetings
  where lower(institution_name) in ('eurad conference', 'smmt regional networking (north)', 'the defence forum')
    and legacy_schedule_item_id is not null
)
update public.schedule_items
set item_type = 'third_party', status = 'confirmed'
where id in (select legacy_schedule_item_id from misfiled);

delete from public.potential_meetings
where lower(institution_name) in ('eurad conference', 'smmt regional networking (north)', 'the defence forum')
   or lower(institution_name) like 'busines%meetings%';
