alter table public.schedule_items
  add column if not exists registration_deadline timestamptz;
