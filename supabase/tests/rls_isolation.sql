-- Manual RLS checklist. Run each block in a disposable database after replacing
-- the placeholders. The querying role must not be postgres/service_role because
-- those roles bypass RLS.

begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"STARTUP_A_USER_UUID","role":"authenticated"}', true);

-- Expected: every returned row has STARTUP_A_ORG_UUID.
select organisation_id, decision, note from public.event_responses;
select organisation_id, title, note from public.availability_blocks;
select organisation_id, schedule_item_id from public.schedule_item_organisations;

-- Expected: no draft items and no items targeted only to Startup B.
select id, title, status, visibility_scope from public.schedule_items;
rollback;

-- Run this separately. Expected: ERROR 42501, new row violates row-level security.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"STARTUP_A_USER_UUID","role":"authenticated"}', true);
insert into public.availability_blocks (organisation_id, title, starts_at, ends_at, created_by)
values ('STARTUP_B_ORG_UUID', 'Must be rejected', now(), now() + interval '1 hour', 'STARTUP_A_USER_UUID');
rollback;

-- Repeat with Startup B, then test in two private browser sessions as described
-- in README.md. Startup B must not learn Startup A's busy indicator or notes.
