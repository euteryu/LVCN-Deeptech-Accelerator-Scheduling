-- PA Robotics user access. Safe to rerun.
do $$
declare
  pa_id uuid;
begin
  select id into pa_id from public.organisations where slug = 'pa-robotics';
  if pa_id is null then raise exception 'PA Robotics organisation is missing.'; end if;

  insert into public.allowed_invites (email, full_name, role, organisation_id)
  values
    ('powerceo@pa-robotics.co.kr', '황장선', 'startup_member', pa_id),
    ('nh_power@pa-robotics.co.kr', '강남현', 'startup_member', pa_id),
    ('taeseon@pa-robotics.co.kr', 'PA Robotics team', 'startup_member', pa_id)
  on conflict (email) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        organisation_id = excluded.organisation_id;

  -- If any of these people already created an auth account, provision their
  -- application profile immediately rather than waiting for a second sign-up.
  insert into public.profiles (id, email, full_name, role, organisation_id)
  select au.id, lower(au.email), invite.full_name, invite.role, invite.organisation_id
  from auth.users au
  join public.allowed_invites invite on invite.email = lower(au.email)
  where invite.organisation_id = pa_id
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    organisation_id = excluded.organisation_id;
end $$;
