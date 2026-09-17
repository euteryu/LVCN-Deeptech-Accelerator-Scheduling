-- "Open" does not communicate useful progress to a participating company.
-- Existing business-meeting records are normalised to the clearer Contacted
-- status, while retaining Agreed and Rejected records as-is.
update public.schedule_items
set meeting_status = 'Contacted'
where item_type = 'business_meeting'
  and lower(trim(coalesce(meeting_status, ''))) = 'open';

-- The scheduled mentor meeting supersedes the duplicate MD One opportunity.
update public.schedule_items
set meeting_note = 'Founder of the UK’s Defence BattleLab tech accelerator. Has agreed to a weekly meeting while you are in the UK.'
where title = 'Mentor Meeting with Edward Ebbern (MD One)';
