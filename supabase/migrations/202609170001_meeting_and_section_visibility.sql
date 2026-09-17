-- Keeps programme records intact while letting LVCN control what startup
-- accounts see in the Potential Biz Meets area and navigation.
alter table public.schedule_items
  add column if not exists meeting_category text,
  add column if not exists meeting_status text,
  add column if not exists contact_name text,
  add column if not exists meeting_note text;

-- Existing generic diary holds should not be mixed with named opportunities.
update public.schedule_items
set meeting_category = 'Business meeting'
where item_type = 'business_meeting' and meeting_category is null;

create table if not exists public.meeting_category_visibility (
  category text primary key check (char_length(trim(category)) between 1 and 120),
  visible_to_startups boolean not null default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_section_visibility (
  section_id text primary key check (section_id in ('calendar', 'business-meetings', 'decisions', 'location', 'toilets', 'external-events')),
  visible_to_startups boolean not null default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.meeting_category_visibility (category, visible_to_startups)
values ('Business meeting', false)
on conflict (category) do nothing;

-- The requested initial state: keep the UK Toilet Map available to LVCN admins
-- but out of startup navigation. Other sections remain visible by default.
insert into public.app_section_visibility (section_id, visible_to_startups)
values ('toilets', false)
on conflict (section_id) do nothing;

create trigger meeting_category_visibility_updated before update on public.meeting_category_visibility for each row execute function public.set_updated_at();
create trigger app_section_visibility_updated before update on public.app_section_visibility for each row execute function public.set_updated_at();

alter table public.meeting_category_visibility enable row level security;
alter table public.app_section_visibility enable row level security;

create policy "authenticated users see meeting category visibility" on public.meeting_category_visibility for select to authenticated using (true);
create policy "admins manage meeting category visibility" on public.meeting_category_visibility for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());
create policy "authenticated users see section visibility" on public.app_section_visibility for select to authenticated using (true);
create policy "admins manage section visibility" on public.app_section_visibility for all to authenticated using (public.is_lvnc_admin()) with check (public.is_lvnc_admin());

drop policy if exists "members see allowed schedule items" on public.schedule_items;
create policy "members see allowed schedule items" on public.schedule_items for select to authenticated using (
  public.is_lvnc_admin() or (
    ((item_type = 'lvnc_core' and status = 'confirmed') or (item_type <> 'lvnc_core' and status in ('proposed', 'confirmed')))
    and (item_type <> 'business_meeting' or not exists (
      select 1 from public.meeting_category_visibility mcv
      where mcv.category = coalesce(schedule_items.meeting_category, 'Business meeting')
        and mcv.visible_to_startups = false
    ))
    and (visibility_scope = 'cohort' or exists (
      select 1 from public.schedule_item_organisations sio
      where sio.schedule_item_id = schedule_items.id and sio.organisation_id = public.my_organisation_id()
    ))
  )
);
