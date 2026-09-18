-- Reset only labelled QA fixtures. Leaves real company decisions untouched.
begin;
update public.event_responses r set decision='undecided', note=null, admin_reviewed_at=null, admin_reviewed_by=null
from public.schedule_items s, public.organisations o
where r.schedule_item_id=s.id and r.organisation_id=o.id and o.slug='test-company' and s.title like '[TEST]%';
update public.potential_meeting_decisions d set decision='undecided',note=null,admin_reviewed_at=null,admin_reviewed_by=null
from public.potential_meetings p, public.organisations o
where d.potential_meeting_id=p.id and p.organisation_id=o.id and o.slug='test-company' and p.institution_name like '[TEST]%';
commit;
