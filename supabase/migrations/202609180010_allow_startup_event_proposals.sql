-- Startup members can propose a dated external event for their own company.
-- Programme items and Potential Biz Meets remain LVCN-admin managed.
drop policy if exists "members see allowed schedule items" on public.schedule_items;
create policy "members see allowed schedule items" on public.schedule_items for select to authenticated using (
  public.is_lvnc_admin() or (
    (
      created_by = auth.uid()
      or (
        ((item_type = 'lvnc_core' and status = 'confirmed') or (item_type <> 'lvnc_core' and status in ('proposed', 'confirmed')))
        and (
          visibility_scope = 'cohort' or exists (
            select 1 from public.schedule_item_organisations sio
            where sio.schedule_item_id = schedule_items.id
              and sio.organisation_id = public.my_organisation_id()
          )
        )
      )
    )
  )
);

create policy "members propose own external events" on public.schedule_items
for insert to authenticated with check (
  public.is_lvnc_admin() or (
    created_by = auth.uid()
    and item_type = 'third_party'
    and status = 'proposed'
    and visibility_scope = 'selected_organisations'
  )
);

create policy "members target own event proposals" on public.schedule_item_organisations
for insert to authenticated with check (
  public.is_lvnc_admin() or (
    organisation_id = public.my_organisation_id()
    and exists (
      select 1 from public.schedule_items item
      where item.id = schedule_item_id
        and item.created_by = auth.uid()
        and item.item_type = 'third_party'
        and item.status = 'proposed'
        and item.visibility_scope = 'selected_organisations'
    )
  )
);
