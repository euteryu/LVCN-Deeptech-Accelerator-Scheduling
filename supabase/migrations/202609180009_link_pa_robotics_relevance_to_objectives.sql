-- Make the startup-visible relevance of PA Robotics opportunities explicit.
-- The copy maps each route to PA Robotics' four UK-programme objectives:
-- Pillarhouse/Power Auto System EMS introductions, wider EMS networking,
-- current-round investor meetings, and a UK distributor/sales representative.
update public.potential_meetings
set startup_visible_note = case
  when lower(category) like '%investor%' or lower(category) like '%venture%' or lower(category) like '%growth capital%' or lower(category) like '%growth finance%' or lower(category) like '%seed finance%' then
    'Supports PA Robotics'' VC-networking objective: a potential investor conversation for the current funding round, subject to confirming sector and stage fit before an introduction.'
  when lower(category) like '%electronics manufacturing%' or lower(category) like '%contract manufacturing%' then
    'Directly supports the Pillarhouse cooperation and EMS-networking objectives: Power Auto System can help introduce this EMS contact, where PA Robotics insertion machines and Pillarhouse soldering systems could be positioned as an integrated SMT-line solution.'
  when lower(category) like '%industrial distribution%' then
    'Supports the UK sales-partner objective by identifying a potential distributor or sales representative with an established electronics and industrial-automation customer base.'
  when lower(category) like '%manufacturing%' or lower(category) like '%automation%' or lower(category) like '%robotics%' or lower(category) like '%automotive%' or lower(category) like '%battery%' then
    'Supports the Pillarhouse cooperation and wider EMS-networking objectives: this is a route to relevant manufacturers, integrators or EMS companies for integrated SMT-line discussions involving PA Robotics insertion machines and Pillarhouse soldering systems.'
  when lower(category) like '%compliance%' then
    'Supports the UK sales-partner objective by helping PA Robotics prepare the technical and market-readiness materials a qualified UK distributor or sales representative will need.'
  else
    'Supports PA Robotics'' UK programme objectives by creating a potential route to relevant EMS customers, strategic partners, investors or a qualified UK sales channel; qualify the most appropriate objective before outreach.'
end,
updated_at = now()
where organisation_id = (select id from public.organisations where slug = 'pa-robotics');
