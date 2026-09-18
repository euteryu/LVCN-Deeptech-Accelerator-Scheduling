-- Partner observers may browse startup-safe Potential Biz Meet rows and the
-- submitted decision/priority rating, but never private admin details or edits.
create policy "partner observers see potential meetings" on public.potential_meetings
for select to authenticated using (public.is_partner_observer());

create policy "partner observers see meeting decisions" on public.potential_meeting_decisions
for select to authenticated using (public.is_partner_observer());
