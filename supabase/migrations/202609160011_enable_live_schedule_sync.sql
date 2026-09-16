-- Allow connected programme-board clients to receive live changes.
-- Safe to run once; ignore the duplicate-publication notice if this was
-- already enabled from the Supabase dashboard.
do $$ begin alter publication supabase_realtime add table public.schedule_items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.event_responses; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.availability_blocks; exception when duplicate_object then null; end $$;
