-- Publish row changes so the existing browser subscriptions receive updates.
-- Private contact details are deliberately excluded.
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='potential_meetings') then
    alter publication supabase_realtime add table public.potential_meetings;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='potential_meeting_decisions') then
    alter publication supabase_realtime add table public.potential_meeting_decisions;
  end if;
end $$;
