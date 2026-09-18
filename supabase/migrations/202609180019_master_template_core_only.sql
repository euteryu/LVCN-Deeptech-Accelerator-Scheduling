-- The Master Template is reserved for compulsory/core cohort events.
-- Legacy non-core cohort rows are moved out of the shared template before the
-- guard is added; targeted rows remain available to their selected startups.
update public.schedule_items
set visibility_scope = 'selected_organisations'
where visibility_scope = 'cohort'
  and item_type <> 'lvnc_core';

alter table public.schedule_items
  drop constraint if exists schedule_items_master_template_core_only;

alter table public.schedule_items
  add constraint schedule_items_master_template_core_only
  check (visibility_scope <> 'cohort' or item_type = 'lvnc_core');
