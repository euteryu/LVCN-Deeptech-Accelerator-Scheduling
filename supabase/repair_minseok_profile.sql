-- Run once in the Supabase SQL Editor only if Minseok signed in before
-- contacts_invites.sql was executed. This creates/repairs his admin profile.

insert into public.profiles (id, email, full_name, role, organisation_id)
select
  u.id,
  lower(u.email),
  i.full_name,
  i.role,
  i.organisation_id
from auth.users u
join public.allowed_invites i
  on lower(i.email) = lower(u.email)
where lower(u.email) = 'minseok@lvcn.co.uk'
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  organisation_id = excluded.organisation_id;
