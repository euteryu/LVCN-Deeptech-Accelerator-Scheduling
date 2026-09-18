-- PA Robotics has been contacted by email for these opportunities.
-- Only Draft records are changed; existing Agreed/Rejected/Paused states remain intact.
update public.potential_meetings
set status = 'contacted',
    updated_at = now()
where organisation_id = (select id from public.organisations where slug = 'pa-robotics')
  and status = 'draft';
