create extension if not exists pgcrypto;

create type public.app_role as enum ('startup_member', 'lvnc_admin', 'partner_observer');
create type public.item_type as enum ('lvnc_core', 'third_party', 'business_meeting', 'company_work');
create type public.visibility_scope as enum ('cohort', 'selected_organisations');
create type public.attendance_rule as enum ('compulsory', 'recommended', 'optional');
create type public.time_precision as enum ('exact', 'morning', 'afternoon', 'evening', 'all_day', 'unknown');
create type public.cost_type as enum ('free', 'paid', 'not_applicable', 'unknown');
create type public.item_status as enum ('draft', 'proposed', 'confirmed', 'cancelled');
create type public.booking_status as enum ('not_required', 'to_register', 'register_interest', 'approval_required', 'invite_required', 'to_arrange', 'verified', 'details_to_verify');
create type public.item_priority as enum ('must_pursue', 'strong_option', 'conditional', 'low_priority', 'not_rated');
create type public.event_decision as enum ('going', 'interested', 'pass', 'acknowledged', 'undecided');

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.allowed_invites (
  email text primary key check (email = lower(email)),
  full_name text,
  role public.app_role not null,
  organisation_id uuid references public.organisations(id) on delete restrict,
  invited_at timestamptz not null default now(),
  constraint startup_invite_has_org check ((role = 'lvnc_admin') or organisation_id is not null)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null,
  organisation_id uuid references public.organisations(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint startup_profile_has_org check ((role = 'lvnc_admin') or organisation_id is not null)
);

create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  description text,
  item_type public.item_type not null,
  visibility_scope public.visibility_scope not null default 'cohort',
  attendance_rule public.attendance_rule not null default 'optional',
  starts_at timestamptz,
  ends_at timestamptz,
  time_precision public.time_precision not null default 'unknown',
  location text,
  meeting_link text,
  event_url text,
  cost_type public.cost_type not null default 'unknown',
  cost_note text,
  status public.item_status not null default 'draft',
  booking_status public.booking_status not null default 'details_to_verify',
  priority public.item_priority not null default 'not_rated',
  fit text,
  next_action text,
  source_note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_time_range check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint unknown_time_consistency check (time_precision <> 'unknown' or starts_at is null)
);

create table public.schedule_item_organisations (
  schedule_item_id uuid not null references public.schedule_items(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  primary key (schedule_item_id, organisation_id)
);

create table public.conflict_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date,
  description text,
  max_selections integer not null default 1 check (max_selections > 0)
);

create table public.schedule_item_conflict_groups (
  schedule_item_id uuid not null references public.schedule_items(id) on delete cascade,
  conflict_group_id uuid not null references public.conflict_groups(id) on delete cascade,
  primary key (schedule_item_id, conflict_group_id)
);

create table public.event_responses (
  id uuid primary key default gen_random_uuid(),
  schedule_item_id uuid not null references public.schedule_items(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  decision public.event_decision not null default 'undecided',
  note text,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (schedule_item_id, organisation_id)
);

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  note text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index schedule_items_starts_at_idx on public.schedule_items(starts_at);
create index schedule_items_status_idx on public.schedule_items(status);
create index schedule_items_type_idx on public.schedule_items(item_type);
create index schedule_item_orgs_org_idx on public.schedule_item_organisations(organisation_id);
create index responses_org_idx on public.event_responses(organisation_id);
create index responses_item_idx on public.event_responses(schedule_item_id);
create index availability_org_time_idx on public.availability_blocks(organisation_id, starts_at, ends_at);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger schedule_items_updated before update on public.schedule_items for each row execute function public.set_updated_at();
create trigger event_responses_updated before update on public.event_responses for each row execute function public.set_updated_at();
create trigger availability_updated before update on public.availability_blocks for each row execute function public.set_updated_at();

create or replace function public.provision_allowed_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare invite public.allowed_invites%rowtype;
begin
  select * into invite from public.allowed_invites where email = lower(new.email);
  if not found then return new; end if;
  insert into public.profiles (id, email, full_name, role, organisation_id)
  values (new.id, lower(new.email), invite.full_name, invite.role, invite.organisation_id)
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.provision_allowed_user();

create or replace function public.is_lvnc_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'lvnc_admin');
$$;

create or replace function public.my_organisation_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select organisation_id from public.profiles where id = auth.uid();
$$;

revoke all on function public.is_lvnc_admin() from public;
revoke all on function public.my_organisation_id() from public;
grant execute on function public.is_lvnc_admin() to authenticated;
grant execute on function public.my_organisation_id() to authenticated;
