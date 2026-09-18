-- Add the supplied healthcare / medtech outreach list to the canonical Dotter record.
-- Idempotent: existing institutions are preserved and duplicate names are not inserted.
do $$
declare
  dotter_id uuid;
  admin_id uuid;
begin
  select id into dotter_id from public.organisations where slug = 'dotter' or lower(name) = 'dotter';
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  if dotter_id is null then raise exception 'Canonical Dotter organisation is missing.'; end if;
  if admin_id is null then raise exception 'No LVCN admin profile exists.'; end if;

  with names(institution_name, category) as (values
    ('Former NHS medical director (NHS London Procurement Partnership)','NHS / procurement'),
    ('Department for Business and Trade','Government / market access'),
    ('LIHE / King''s College London','University / clinical research'),
    ('Innovate UK','Government / innovation funding'),
    ('SV Health Investors','Healthcare investor'),('Advent Life Sciences','Healthcare investor'),('Medicxi','Healthcare investor'),
    ('BGF','Growth investor'),('Cambridge Innovation Capital','University-linked investor'),('IP Group','University-linked investor'),
    ('Sofinnova Partners','Life-sciences investor'),('British Heart Foundation','Research / charity'),
    ('NICE','Health technology assessment'),('MedCity','Health innovation ecosystem'),
    ('Barts Heart Centre (Barts Health NHS Trust)','NHS / clinical partner'),('Royal Brompton Hospital','NHS / clinical partner'),
    ('Golden Jubilee National Hospital','NHS / clinical partner'),('ProPharma','Regulatory / quality'),('NAMSA','Regulatory / clinical trials'),
    ('EQT Life Sciences','Life-sciences investor'),('Gilde Healthcare','Healthcare investor'),('HealthCap','Healthcare investor'),
    ('Apposite Capital','Healthcare investor'),('Epidarex Capital','Healthcare investor'),('Parkwalk Advisors','University-linked investor'),
    ('Octopus Ventures','Venture investor'),('BGF Early Stage','Growth investor'),('Syncona','Life-sciences investor'),
    ('4BIO Capital','Life-sciences investor'),('Forbion','Life-sciences investor'),('LifeArc Ventures','Research / investor'),
    ('Sofinnova MD Start','Life-sciences investor'),('Kurma Partners','Life-sciences investor'),('MedTech Convergence Fund','Medtech investor'),
    ('Ysios Capital','Life-sciences investor'),('Novo Holdings','Life-sciences investor'),('M Ventures','Corporate venture'),
    ('JJDC','Corporate venture'),('Medtronic Ventures','Medtech corporate venture'),('GE HealthCare Ventures','Medtech corporate venture'),
    ('Philips Ventures','Medtech corporate venture'),('Siemens Healthineers Ventures','Medtech corporate venture'),
    ('Boston Scientific Ventures','Medtech corporate venture'),('Abbott Ventures','Medtech corporate venture'),('Stryker Ventures','Medtech corporate venture'),
    ('Roche Venture Fund','Pharma corporate venture'),('Johnson & Johnson Innovation','Pharma corporate venture'),('UCB Ventures','Pharma corporate venture'),
    ('Samsara BioCapital','Biotech investor'),('F-Prime Capital','Healthcare investor'),('RA Capital','Healthcare investor'),
    ('OrbiMed','Healthcare investor'),('Deerfield','Healthcare investor'),('Cowen Healthcare Investments','Healthcare investor'),
    ('Vesalius Biocapital','Biotech investor'),('Wellington Partners','Life-sciences investor'),('LSP','Life-sciences investor'),
    ('Molten Ventures','Venture investor'),('AlbionVC','Venture investor'),('Nautilus Venture Partners','Venture investor'),
    ('Oxford Science Enterprises','University-linked investor'),('Longwall Ventures','Deep-tech investor'),('British Patient Capital','Growth investor'),
    ('Schroders Capital','Institutional investor'),('Abingworth','Life-sciences investor'),('Amadeus Capital Partners','Deep-tech investor'),
    ('Apax Partners','Growth investor'),('General Atlantic','Growth investor'),('Oxford Sciences Enterprises','University-linked investor'),
    ('Warburg Pincus','Growth investor'),('Wellcome Trust','Research / funder'),('Ahren Innovation Capital','Deep-tech investor'),
    ('Andera Partners (formerly EdRIP)','Life-sciences investor'),('Baillie Gifford','Institutional investor'),('BioMed Partners','Biotech investor'),
    ('Boston Scientific Corporate Strategic Investments','Medtech corporate venture'),('Bridgepoint','Growth investor'),('Cinven','Growth investor'),
    ('EQT','Growth investor'),('Fresenius Medical Care Ventures','Healthcare corporate venture'),('GIC','Institutional investor'),
    ('KKR Health Care Strategic Growth Fund','Healthcare investor'),('Kreos Capital','Venture debt'),('Mercia Asset Management','Venture investor'),
    ('Mubadala Capital','Institutional investor'),('Next47 (Siemens)','Corporate venture'),('Northern Gritstone','University-linked investor'),
    ('Panakes Partners','Medtech investor'),('Philips Corporate Ventures','Medtech corporate venture'),('Qatar Investment Authority','Institutional investor'),
    ('Seventure Partners','Healthcare investor'),('Temasek','Institutional investor'),('Terumo Ventures','Medtech corporate venture'),
    ('Vitruvian Partners','Growth investor')
  )
  insert into public.potential_meetings (organisation_id, institution_name, category, status, startup_visible_note, next_action, created_by)
  select dotter_id, n.institution_name, n.category, 'draft',
    'Potential Dotter partner, research, clinical, regulatory or financing conversation.',
    'Confirm the best contact and request a targeted introduction.', admin_id
  from names n
  where not exists (
    select 1 from public.potential_meetings p
    where p.organisation_id = dotter_id
      and lower(trim(p.institution_name)) = lower(trim(n.institution_name))
  );
end $$;
