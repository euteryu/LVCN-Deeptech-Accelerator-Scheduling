-- Ensure the Dotter login is attached to the same canonical organisation used
-- by Dotter's schedule targets. This makes the member's RLS visibility match
-- the programme data.
update public.profiles
set organisation_id = (select id from public.organisations where slug = 'dotter')
where lower(email) = 'h.i.kim@dotter.com'
  and role = 'startup_member'
  and organisation_id is distinct from (
    select id from public.organisations where slug = 'dotter'
  );
