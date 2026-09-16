-- LVCN participant and administrator allow-list, prepared from
-- SVC_UK_Programme_Contacts.xlsx (Q22 Participants).
-- Run after the initial schema migration. Safe to run more than once.
--
-- PA Robotics note: the workbook lists two addresses for Namhyun Kang:
-- nh_powerceo@pa-robotics.co.kr (Q22) and nh_power@pa-robotics.co.kr
-- (Basic Information). Only the Q22 address is included below.

begin;

insert into public.organisations (id, name, slug) values
  ('11111111-1111-4111-8111-111111111111', 'Seoul Labs', 'seoul-labs'),
  ('22222222-2222-4222-8222-222222222222', 'FUST Lab', 'fust-lab'),
  ('99999999-9999-4999-8999-999999999991', 'Deep Fusion AI', 'deep-fusion-ai'),
  ('99999999-9999-4999-8999-999999999992', 'Dotter', 'dotter'),
  ('99999999-9999-4999-8999-999999999994', 'HME Square', 'hme-square'),
  ('99999999-9999-4999-8999-999999999995', 'Jiro', 'jiro'),
  ('99999999-9999-4999-8999-999999999996', 'PA Robotics (Powerauto Robotics)', 'pa-robotics'),
  ('99999999-9999-4999-8999-999999999998', 'YepBio', 'yepbio')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

insert into public.allowed_invites (email, full_name, role, organisation_id) values
  -- LVCN administrators
  ('dan@lvcn.co.uk', 'Dan Idhenga', 'lvnc_admin', null),
  ('aadam@lvcn.co.uk', 'Aadam Sumer', 'lvnc_admin', null),
  ('admin@londonvcnetwork.com', 'Aadam Sumer', 'lvnc_admin', null),
  ('leo@lvcn.co.uk', 'Leo Henghes', 'lvnc_admin', null),
  ('minseok@lvcn.co.uk', 'Minseok Ryu', 'lvnc_admin', null),

  -- Q22 participants
  ('kyujin.lee@deep-fusion.com', 'KyuJin Lee', 'startup_member', (select id from public.organisations where slug = 'deep-fusion-ai')),
  ('h.i.kim@dotter.com', 'Hyungil Kim', 'startup_member', (select id from public.organisations where slug = 'dotter')),
  ('audrey@dotter.com', 'Audrey Tjia', 'startup_member', (select id from public.organisations where slug = 'dotter')),
  ('jake@dotter.com', 'Inchul Hwang', 'startup_member', (select id from public.organisations where slug = 'dotter')),
  ('nora@dotter.com', 'Yuna Noh (Yoonah?)', 'startup_member', (select id from public.organisations where slug = 'dotter')),
  ('min@fustlab.com', 'Minsung Hwangbo', 'startup_member', (select id from public.organisations where slug = 'fust-lab')),
  ('swim@fustlab.com', 'Seokwu Im', 'startup_member', (select id from public.organisations where slug = 'fust-lab')),
  ('juliekim@fustlab.com', 'Julie (Yejin) Kim', 'startup_member', (select id from public.organisations where slug = 'fust-lab')),
  ('ykhang@hmesquare.com', 'Yoonho Khang', 'startup_member', (select id from public.organisations where slug = 'hme-square')),
  ('hwki@hmesquare.com', 'Hyunwoo Ki', 'startup_member', (select id from public.organisations where slug = 'hme-square')),
  ('jasonlee@jirocorp.io', 'Jason Lee', 'startup_member', (select id from public.organisations where slug = 'jiro')),
  ('kseo@jirocorp.io', 'Kevin Seo', 'startup_member', (select id from public.organisations where slug = 'jiro')),
  ('powerceo@pa-robotics.co.kr', 'Jangseon Hwang', 'startup_member', (select id from public.organisations where slug = 'pa-robotics')),
  ('nh_powerceo@pa-robotics.co.kr', 'Namhyun Kang', 'startup_member', (select id from public.organisations where slug = 'pa-robotics')),
  ('taeseon@pa-robotics.co.kr', 'Taeseon Hwang', 'startup_member', (select id from public.organisations where slug = 'pa-robotics')),
  ('ceo@seoullabs.io', 'Do-Hee Jang', 'startup_member', (select id from public.organisations where slug = 'seoul-labs')),
  ('jshin24@yepbio.com', 'Joo-Ho Shin', 'startup_member', (select id from public.organisations where slug = 'yepbio')),
  ('leesw@yepbio.com', 'Seokwon Lee', 'startup_member', (select id from public.organisations where slug = 'yepbio'))
on conflict (email) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  organisation_id = excluded.organisation_id;

commit;
