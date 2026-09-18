-- Potential Biz Meets are startup-specific relationship records, not events.
-- One row represents one institution/contact pursuing one startup.
create type public.potential_meeting_status as enum ('draft', 'contacted', 'agreed', 'rejected', 'paused');

create table public.potential_meetings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  institution_name text not null check (char_length(trim(institution_name)) between 1 and 180),
  category text not null default 'Other',
  status public.potential_meeting_status not null default 'draft',
  proposed_starts_at timestamptz,
  proposed_ends_at timestamptz,
  location text,
  external_url text,
  startup_visible_note text,
  next_action text,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (proposed_ends_at is null or proposed_starts_at is null or proposed_ends_at > proposed_starts_at)
);

-- Contact data and internal notes are deliberately separate so they are never
-- returned to startup accounts by a broad row select.
create table public.potential_meeting_admin_details (
  potential_meeting_id uuid primary key references public.potential_meetings(id) on delete cascade,
  contact_name text,
  contact_email text,
  internal_note text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.potential_meeting_decisions (
  potential_meeting_id uuid primary key references public.potential_meetings(id) on delete cascade,
  decision public.event_decision not null default 'undecided',
  note text,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

create index potential_meetings_org_idx on public.potential_meetings(organisation_id, status);
create index potential_meetings_institution_idx on public.potential_meetings(institution_name);

create trigger potential_meetings_updated before update on public.potential_meetings for each row execute function public.set_updated_at();
create trigger potential_meeting_admin_details_updated before update on public.potential_meeting_admin_details for each row execute function public.set_updated_at();
create trigger potential_meeting_decisions_updated before update on public.potential_meeting_decisions for each row execute function public.set_updated_at();

alter table public.potential_meetings enable row level security;
alter table public.potential_meeting_admin_details enable row level security;
alter table public.potential_meeting_decisions enable row level security;

create policy "admins manage potential meetings" on public.potential_meetings for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());
create policy "startups see their potential meetings" on public.potential_meetings for select to authenticated using (organisation_id = public.my_organisation_id());
create policy "admins manage potential meeting details" on public.potential_meeting_admin_details for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());
create policy "admins manage potential meeting decisions" on public.potential_meeting_decisions for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());
create policy "startup manages own potential meeting decision" on public.potential_meeting_decisions for all to authenticated using (
  exists (select 1 from public.potential_meetings pm where pm.id = potential_meeting_id and pm.organisation_id = public.my_organisation_id())
) with check (
  exists (select 1 from public.potential_meetings pm where pm.id = potential_meeting_id and pm.organisation_id = public.my_organisation_id())
);
