-- Run this once if 202609160003_quick_email_access.sql was already applied.
-- It fixes an ambiguous column reference in the quick-access function.

create or replace function public.claim_quick_access(access_email text)
returns table (
  id uuid,
  email text,
  full_name text,
  role public.app_role,
  organisation_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.allowed_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'An anonymous session is required before claiming access';
  end if;

  select * into invite
  from public.allowed_invites ai
  where ai.email = lower(trim(access_email));

  if not found then
    raise exception 'This email is not on the LVCN allow-list';
  end if;

  insert into public.profiles (id, email, full_name, role, organisation_id)
  values (auth.uid(), invite.email, invite.full_name, invite.role, invite.organisation_id)
  on conflict on constraint profiles_pkey do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    organisation_id = excluded.organisation_id;

  return query
  select p.id, p.email, p.full_name, p.role, p.organisation_id
  from public.profiles p
  where p.id = auth.uid();
end;
$$;
