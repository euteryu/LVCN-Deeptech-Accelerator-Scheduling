-- schedule_events is a security-invoker view. Startup sessions therefore need
-- SELECT on both the view and each table used by the schedule REST query.
-- Without the underlying grant PostgREST returns 401 / "permission denied for
-- table schedule_items", even when the row-level policy would allow the row.
grant usage on schema public to authenticated;
grant select on public.schedule_events,
  public.schedule_items,
  public.schedule_item_organisations,
  public.schedule_item_conflict_groups,
  public.meeting_category_visibility,
  public.event_responses,
  public.event_response_messages
to authenticated;
