-- PA Robotics prospecting list supplied by LVCN.  These are relationship
-- records, not calendar events; the insert is idempotent by startup/name.
do $$
declare v_admin uuid;
begin
  select id into v_admin from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  insert into public.potential_meetings
    (organisation_id, institution_name, category, external_url, created_by)
  select '99999999-9999-4999-8999-999999999996'::uuid, v.name, v.category, v.url, v_admin
  from (values
    ('InMotion Ventures (JLR CVC)','Corporate venture / automotive','https://www.inmotion.ventures/'),
    ('Warwick Manufacturing Group','Manufacturing R&D / robotics','https://warwick.ac.uk/fac/sci/wmg/'),
    ('Innovate UK','Innovation funding / manufacturing','https://www.ukri.org/councils/innovate-uk/'),
    ('AMRC, Sheffield','Advanced manufacturing R&D','https://www.amrc.co.uk/'),
    ('Ocado Technology','Robotics / automation partner','https://www.ocadotechnology.com/'),
    ('Siemens UK','Industrial automation / strategic partner','https://www.siemens.com/uk/en.html'),
    ('ABB UK','Industrial automation / strategic partner','https://new.abb.com/uk'),
    ('Rolls-Royce (advanced manufacturing)','Advanced manufacturing / aerospace','https://www.rolls-royce.com/'),
    ('BAE Systems (manufacturing)','Advanced manufacturing / defence','https://www.baesystems.com/'),
    ('Eaton Aerospace','Aerospace manufacturing / systems','https://www.eaton.com/gb/en-gb.html'),
    ('IQ Capital','Deep-tech investor','https://www.iqcapital.co.uk/'),
    ('Amadeus Capital Partners','Deep-tech investor','https://amadeuscapital.com/'),
    ('BGF Early Stage','Investor','https://www.bgf.co.uk/'),
    ('Cambridge Innovation Capital','Deep-tech investor','https://www.cicplc.co.uk/'),
    ('Parkwalk Advisors','University spinout investor','https://parkwalkadvisors.com/'),
    ('ABB Ventures','Corporate venture','https://new.abb.com/ventures'),
    ('Siemens Energy Ventures','Corporate venture / energy','https://www.siemens-energy.com/global/en/company/innovation/venture-capital.html'),
    ('Mitsubishi Corporation','Corporate / industrial partner','https://www.mitsubishicorp.com/gb/en/'),
    ('Bosch Ventures','Corporate venture / industrial','https://www.bosch.ventures/'),
    ('BMW i Ventures','Corporate venture / mobility','https://www.bmwiventures.com/'),
    ('Toyota Ventures','Corporate venture / mobility','https://toyota.ventures/'),
    ('Hyundai CRADLE','Corporate venture / mobility','https://www.hyundai.com/worldwide/en/company/hyundai-cradle'),
    ('Samsung Ventures','Corporate venture / technology','https://samsungventures.com/'),
    ('Atlantic Bridge','Deep-tech investor','https://www.atlanticbridge.com/'),
    ('AlbionVC','Venture investor','https://albion.vc/'),
    ('Molten Ventures','Deep-tech investor','https://www.moltenventures.com/'),
    ('Balderton Capital','Venture investor','https://www.balderton.com/'),
    ('Atomico','Venture investor','https://www.atomico.com/'),
    ('Lakestar','Venture investor','https://www.lakestar.com/'),
    ('Northzone','Venture investor','https://northzone.com/'),
    ('EQT Ventures','Venture investor','https://eqtventures.com/'),
    ('Dawn Capital','B2B technology investor','https://www.dawncapital.com/'),
    ('Highland Europe','Growth investor','https://highlandeurope.com/'),
    ('M&G Catalyst','Growth / impact investor','https://www.mandg.com/'),
    ('British Patient Capital','Patient capital investor','https://www.britishpatientcapital.co.uk/'),
    ('Schroders Capital','Institutional investor','https://www.schroders.com/en-gb/uk/intermediary/our-capabilities/private-assets/'),
    ('British Growth Partnership','Growth capital','https://www.lloydsbankinggroup.com/our-group/working-with-businesses/british-growth-partnership.html'),
    ('Prosus Ventures','Technology investor','https://www.prosus.com/ventures'),
    ('SoftBank Investment Advisers','Technology investor','https://group.softbank/en/vision-fund'),
    ('General Catalyst','Venture investor','https://www.generalcatalyst.com/'),
    ('Eclipse','Deep-tech investor','https://eclipse.vc/'),
    ('Playground Global','Deep-tech investor','https://playground.global/'),
    ('E14 Fund','Deep-tech investor','https://www.e14fund.com/'),
    ('Longwall Ventures','Deep-tech investor','https://www.longwallventures.com/'),
    ('Northern Gritstone','Deep-tech investor','https://northerngritstone.com/'),
    ('Ahren Innovation Capital','Deep-tech investor','https://ahren.uk/'),
    ('MMC Ventures','Deep-tech investor','https://mmc.vc/'),
    ('Crane Venture Partners','Deep-tech investor','https://crane.vc/'),
    ('Entrepreneur First','Founder investor','https://www.joinef.com/'),
    ('LocalGlobe','Seed investor','https://localglobe.vc/'),
    ('Seedcamp','Seed investor','https://seedcamp.com/'),
    ('Hoxton Ventures','Seed investor','https://www.hoxtonventures.com/'),
    ('Notion Capital','B2B technology investor','https://notion.vc/'),
    ('Kindred Capital','Seed investor','https://www.kindredcapital.vc/'),
    ('Frontline Ventures','B2B technology investor','https://frontline.vc/'),
    ('Foresight Group','Growth investor','https://www.foresightgroup.eu/'),
    ('Beringea','Growth investor','https://www.beringea.com/'),
    ('IP Group','University spinout investor','https://www.ipgroupplc.com/'),
    ('Mercia Asset Management','Venture investor','https://www.mercia.co.uk/'),
    ('Vitruvian Partners','Growth investor','https://www.vitruvianpartners.com/'),
    ('Air Street Capital','AI investor','https://www.airstreet.com/'),
    ('BP Ventures','Corporate venture / industrial','https://www.bp.com/en/global/corporate/what-we-do/innovation-and-engineering/bp-ventures.html'),
    ('Cusp Capital','Deep-tech investor','https://cusp.capital/'),
    ('Development Bank of Wales','Public growth finance','https://developmentbank.wales/'),
    ('Fly Ventures','Deep-tech investor','https://www.fly.vc/'),
    ('Forward Partners','Venture investor','https://forwardpartners.com/'),
    ('Innovation Industries','Deep-tech investor','https://innovationindustries.nl/'),
    ('Isomer Capital','Deep-tech investor','https://www.isomercapital.com/'),
    ('Jaguar Land Rover - InMotion Ventures','Corporate venture / mobility','https://www.inmotion.ventures/'),
    ('LDC (Lloyds Development Capital)','Growth investor','https://ldc.co.uk/'),
    ('Legal & General Capital','Institutional investor','https://group.legalandgeneral.com/en/capital'),
    ('LocalGlobe / Latitude','Seed investor','https://localglobe.vc/'),
    ('National Security Strategic Investment Fund (NSSIF)','Defence / deep-tech investor','https://www.gov.uk/government/publications/national-security-strategic-investment-fund'),
    ('Northern Powerhouse Investment Fund','Public growth finance','https://www.npif.co.uk/'),
    ('OTB Ventures','Deep-tech investor','https://otb.vc/'),
    ('Par Equity','Venture investor','https://www.parequity.com/'),
    ('Playfair Capital','Seed investor','https://www.playfair.vc/'),
    ('Praetura Ventures','Venture investor','https://praetura.ventures/'),
    ('Project A Ventures','Venture investor','https://www.project-a.com/'),
    ('Robert Bosch Venture Capital (RBVC)','Corporate venture / industrial','https://www.rbvc.com/'),
    ('Schneider Electric Ventures / Aster Capital','Corporate venture / energy','https://www.se.com/ww/en/about-us/innovation/ventures/'),
    ('Scottish National Investment Bank','Public growth finance','https://www.thebank.scot/'),
    ('Siemens (Next47)','Corporate venture / industrial','https://next47.com/'),
    ('Speedinvest','Seed investor','https://speedinvest.com/'),
    ('UK Innovation & Science Seed Fund (UKI2S)','Public seed finance','https://www.uki2s.com/'),
    ('Verdane','Growth investor','https://verdane.com/'),
    ('Stadium Group','Electronics manufacturing','https://www.stadiumgroup.com/'),
    ('CTS (Custom Technical Services)','Electronics manufacturing','https://www.ctscorp.com/'),
    ('Jabil','Contract manufacturing','https://www.jabil.com/'),
    ('Flex','Contract manufacturing','https://flex.com/'),
    ('Celestica','Contract manufacturing','https://www.celestica.com/'),
    ('ASM Assembly Systems','Electronics manufacturing','https://www.asmpt.com/'),
    ('Mycronic','Electronics manufacturing','https://www.mycronic.com/'),
    ('Yamaha SMT','Electronics manufacturing','https://global.yamaha-motor.com/business/smt/'),
    ('Kurtz Ersa','Electronics manufacturing','https://www.kurtzersa.com/'),
    ('Vitronics Soltec','Electronics manufacturing','https://www.vitronics-soltec.com/'),
    ('Rockwell Automation UK','Industrial automation','https://www.rockwellautomation.com/en-gb.html'),
    ('Siemens Digital Industries UK','Industrial automation','https://www.siemens.com/uk/en/company/about/businesses/digital-industries.html'),
    ('Mitsubishi Electric UK','Industrial automation','https://gb.mitsubishielectric.com/'),
    ('Omron UK','Industrial automation','https://industrial.omron.co.uk/en/home'),
    ('RS Group (RS Components)','Industrial distribution','https://uk.rs-online.com/'),
    ('Farnell','Electronics distribution','https://uk.farnell.com/')
  ) as v(name, category, url)
  where not exists (
    select 1 from public.potential_meetings existing
    where existing.organisation_id = '99999999-9999-4999-8999-999999999996'::uuid
      and lower(trim(existing.institution_name)) = lower(trim(v.name))
  );

  insert into public.potential_meeting_admin_details (potential_meeting_id, contact_name, updated_by)
  select id, 'Onur / Sarah Antor', v_admin
  from public.potential_meetings
  where organisation_id = '99999999-9999-4999-8999-999999999996'::uuid
    and lower(trim(institution_name)) = 'inmotion ventures (jlr cvc)'
  on conflict (potential_meeting_id) do update set contact_name = excluded.contact_name, updated_by = excluded.updated_by;
end $$;
