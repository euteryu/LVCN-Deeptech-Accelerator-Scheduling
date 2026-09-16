-- Replace these example emails before inviting real users.
insert into public.organisations (id, name, slug) values
  ('99999999-9999-4999-8999-999999999991', 'Deep Fusion AI', 'deep-fusion-ai'),
  ('99999999-9999-4999-8999-999999999992', 'Dotter', 'dotter'),
  ('22222222-2222-4222-8222-222222222222', 'FUST Lab', 'fust-lab'),
  ('99999999-9999-4999-8999-999999999994', 'HME Square', 'hme-square'),
  ('99999999-9999-4999-8999-999999999995', 'Jiro', 'jiro'),
  ('99999999-9999-4999-8999-999999999996', 'PA Robotics', 'pa-robotics'),
  ('11111111-1111-4111-8111-111111111111', 'Seoul Labs', 'seoul-labs'),
  ('99999999-9999-4999-8999-999999999998', 'YepBio', 'yepbio')
on conflict (id) do nothing;

insert into public.allowed_invites (email, full_name, role, organisation_id) values
  ('programme@example.com', 'LVCN Programme Admin', 'lvnc_admin', null),
  ('founder@example.com', 'Example Founder', 'startup_member', '11111111-1111-4111-8111-111111111111')
on conflict (email) do update set full_name = excluded.full_name, role = excluded.role, organisation_id = excluded.organisation_id;

-- Schedule rows require created_by to reference a real auth.users row. After the
-- admin signs in, use the application's import review or create-item flow to add
-- representative programme data without weakening referential integrity.
