-- One institution can be relevant to several startups, but LVCN's outreach
-- progress and offered availability may differ for each one. Store that on
-- the existing targeting relationship, not on a duplicated meeting record.
alter table public.schedule_item_organisations
  add column if not exists meeting_outreach_status text not null default 'Contacted'
    check (meeting_outreach_status in ('Contacted', 'Agreed', 'Rejected')),
  add column if not exists availability_note text,
  add column if not exists coordination_note text;

-- Preserve the existing single-record status/note as the starting point for
-- every targeted startup. Admins can then amend them independently.
update public.schedule_item_organisations sio
set meeting_outreach_status = case
      when si.meeting_status in ('Agreed', 'Rejected') then si.meeting_status
      else 'Contacted'
    end,
    coordination_note = coalesce(sio.coordination_note, si.meeting_note)
from public.schedule_items si
where si.id = sio.schedule_item_id
  and si.item_type = 'business_meeting';

create index if not exists schedule_item_organisations_outreach_idx
  on public.schedule_item_organisations (organisation_id, meeting_outreach_status);
