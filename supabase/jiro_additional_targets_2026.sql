-- Jiro / Dropshot AI: additional agency, ecosystem, VC and strategic-capital targets.
-- This file also repairs organisation-name/slug drift (Jiro, Jiro Inc., Dropshot AI).
-- Run manually in Supabase SQL Editor. Safe to rerun and skips existing institutions.
do $$
declare
  jiro_id uuid;
  admin_id uuid;
begin
  select id into jiro_id
  from public.organisations
  where slug in ('jiro', 'jiro-dropshot-ai', 'dropshot-ai')
     or lower(trim(name)) in ('jiro', 'jiro inc.', 'jiro inc', 'dropshot ai')
  order by case when slug = 'jiro' then 0 when lower(trim(name)) = 'jiro' then 1 else 2 end
  limit 1;
  if jiro_id is null then
    insert into public.organisations (name, slug) values ('Jiro', 'jiro') on conflict (slug) do nothing;
    select id into jiro_id from public.organisations where slug = 'jiro';
  end if;
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  if jiro_id is null then raise exception 'Could not resolve or create Jiro organisation.'; end if;
  if admin_id is null then raise exception 'No LVCN admin profile exists.'; end if;

  with targets (institution_name, category, external_url) as (values
    ('Fieldhouse Associates', 'PR / Communications / Creative ecosystem', 'https://fieldhouseassociates.com/'),
    ('WPP (UK office)', 'Advertising agency / strategic partner', 'https://www.wpp.com/'),
    ('Publicis (UK office)', 'Advertising agency / strategic partner', 'https://www.publicisgroupe.com/'),
    ('Havas (UK office)', 'Advertising agency / strategic partner', 'https://www.havas.com/'),
    ('Brandtech Group', 'Advertising technology / strategic partner', 'https://brandtechgroup.com/'),
    ('Ogilvy UK', 'Advertising agency / strategic partner', 'https://www.ogilvy.com/'),
    ('M&C Saatchi', 'Advertising agency / strategic partner', 'https://mcsaatchi.com/'),
    ('dentsu UK', 'Advertising agency / strategic partner', 'https://www.dentsu.com/uk/en'),
    ('IPG Mediabrands UK', 'Advertising agency / strategic partner', 'https://interpublic.com/our-companies/ipg-mediabrands/'),
    ('Creative UK', 'Creative industries / ecosystem', 'https://www.wearecreative.uk/'),
    ('LocalGlobe / Latitude', 'Investor / UK technology', 'https://www.localglobe.vc/'),
    ('Hoxton Ventures', 'Investor / European technology', 'https://www.hoxtonventures.com/'),
    ('Ada Ventures', 'Investor / UK technology', 'https://www.adaventures.com/'),
    ('Balderton Capital', 'Investor / European technology', 'https://www.balderton.com/'),
    ('Atomico', 'Investor / European technology', 'https://atomico.com/'),
    ('Molten Ventures', 'Investor / European technology', 'https://www.moltenventures.com/'),
    ('Highland Europe', 'Investor / European growth software', 'https://highlandeurope.com/'),
    ('Octopus Ventures', 'Investor / UK technology', 'https://octopusventures.com/'),
    ('Notion Capital', 'Investor / B2B software', 'https://www.notion.vc/'),
    ('Dawn Capital', 'Investor / enterprise software', 'https://www.dawncapital.com/'),
    ('Episode 1 Ventures', 'Investor / UK software', 'https://www.episode1.com/'),
    ('Playfair Capital', 'Investor / AI and technology', 'https://www.playfair.vc/'),
    ('MMC Ventures', 'Investor / AI and data', 'https://mmc.vc/'),
    ('Crane Venture Partners', 'Investor / enterprise technology', 'https://crane.vc/'),
    ('SuperSeed', 'Investor / deep tech and AI', 'https://www.superseed.com/'),
    ('Frontline Ventures', 'Investor / B2B technology', 'https://frontline.vc/'),
    ('Northzone', 'Investor / European technology', 'https://northzone.com/'),
    ('EQT Ventures', 'Investor / European technology', 'https://eqtgroup.com/'),
    ('Lakestar', 'Investor / European technology', 'https://www.lakestar.com/'),
    ('General Catalyst', 'Investor / technology and AI', 'https://www.generalcatalyst.com/'),
    ('GV', 'Corporate VC / technology', 'https://gv.com/'),
    ('Prosus Ventures', 'Corporate VC / technology', 'https://www.prosus.com/ventures'),
    ('Felicis', 'Investor / technology and AI', 'https://felicis.com/'),
    ('Index Ventures', 'Investor / software and AI', 'https://www.indexventures.com/'),
    ('Accel', 'Investor / software and AI', 'https://www.accel.com/'),
    ('Lightspeed Venture Partners', 'Investor / technology and AI', 'https://lsvp.com/'),
    ('Andreessen Horowitz', 'Investor / technology and AI', 'https://a16z.com/'),
    ('WPP Ventures', 'Corporate VC / advertising technology', 'https://www.wpp.com/'),
    ('Publicis Ventures', 'Corporate VC / advertising technology', 'https://www.publicisgroupe.com/'),
    ('S4 Capital', 'Advertising technology / strategic partner', 'https://www.s4capital.com/'),
    ('Omnicom Ventures', 'Corporate VC / advertising technology', 'https://www.omnicomgroup.com/'),
    ('Havas Ventures', 'Corporate VC / advertising technology', 'https://www.havas.com/'),
    ('Bertelsmann Investments', 'Corporate VC / media and technology', 'https://www.bertelsmann.com/divisions/bertelsmann-investments/'),
    ('Sky Ventures', 'Corporate VC / media', 'https://www.skygroup.sky/'),
    ('ITV Ventures', 'Corporate VC / media', 'https://www.itv.com/'),
    ('Warner Bros. Discovery Ventures', 'Corporate VC / media', 'https://www.wbd.com/'),
    ('Comcast Ventures', 'Corporate VC / media technology', 'https://www.comcastventures.com/'),
    ('Adobe Ventures', 'Corporate VC / creative technology', 'https://www.adobe.com/'),
    ('NVIDIA NVentures', 'Corporate VC / AI infrastructure', 'https://www.nvidia.com/en-us/nventures/'),
    ('Google Ventures', 'Corporate VC / technology', 'https://gv.com/'),
    ('Microsoft M12', 'Corporate VC / enterprise AI', 'https://m12.vc/'),
    ('Salesforce Ventures', 'Corporate VC / enterprise software', 'https://www.salesforce.com/ventures/'),
    ('HubSpot Ventures', 'Corporate VC / marketing technology', 'https://www.hubspot.com/ventures'),
    ('British Growth Partnership', 'Growth capital / UK technology', 'https://www.british-business-bank.co.uk/'),
    ('M&G Catalyst', 'Growth capital / technology', 'https://www.mandg.com/'),
    ('Schroders Capital', 'Growth capital / technology', 'https://www.schroders.com/'),
    ('SoftBank Investment Advisers', 'Growth capital / technology', 'https://group.softbank/en/vision-fund'),
    ('Seedcamp', 'Investor / European technology', 'https://seedcamp.com/'),
    ('Kindred Capital', 'Investor / UK technology', 'https://www.kindredcapital.vc/'),
    ('Entrepreneur First', 'Founder / investor ecosystem', 'https://www.joinef.com/'),
    ('Antler', 'Investor / founder ecosystem', 'https://www.antler.co/'),
    ('Amadeus Capital Partners', 'Investor / AI and technology', 'https://amadeuscapital.com/'),
    ('British Patient Capital / British Business Bank', 'Public growth capital / UK technology', 'https://www.britishpatientcapital.co.uk/'),
    ('Felix Capital', 'Investor / consumer and technology', 'https://www.felixcap.com/'),
    ('Frog Capital', 'Investor / growth technology', 'https://frogcapital.com/'),
    ('Insight Partners', 'Growth investor / software', 'https://www.insightpartners.com/'),
    ('Unilever Ventures', 'Corporate VC / consumer and marketing', 'https://www.unilever.com/planet-and-society/venture/'),
    ('Ahren Innovation Capital', 'Investor / deep tech and AI', 'https://ahreninnovation.com/'),
    ('Beringea', 'Investor / UK growth capital', 'https://www.beringea.com/'),
    ('Blossom Capital', 'Investor / technology and AI', 'https://www.blossomcap.com/'),
    ('Dentsu Ventures', 'Corporate VC / advertising technology', 'https://www.dentsu.com/ventures/'),
    ('Eight Roads Ventures', 'Investor / technology and growth', 'https://www.eightroads.com/'),
    ('Forward Partners', 'Investor / AI and technology', 'https://forwardpartners.com/'),
    ('Google Gradient Ventures', 'Corporate VC / AI', 'https://gradient.com/'),
    ('Guardian Media Group Ventures (GMG Ventures)', 'Corporate VC / media technology', 'https://www.gmgventures.co.uk/'),
    ('Hambro Perks', 'Investor / technology', 'https://www.hambroperks.com/'),
    ('JamJar Investments', 'Investor / consumer technology', 'https://www.jamjarinvestments.com/'),
    ('L''Oreal BOLD', 'Corporate VC / beauty and creative technology', 'https://www.loreal.com/en/beauty-science-and-technology/bold/'),
    ('Left Lane Capital', 'Growth investor / consumer technology', 'https://www.leftlanecap.com/'),
    ('Mercia Asset Management', 'Investor / UK technology', 'https://www.mercia.co.uk/'),
    ('Northern Powerhouse Investment Fund', 'Public growth capital / UK technology', 'https://www.british-business-bank.co.uk/finance-options/northern-powerhouse-investment-fund'),
    ('Oxford Capital', 'Investor / technology', 'https://oxfordcapital.com/'),
    ('Par Equity', 'Investor / UK technology', 'https://www.parequity.com/'),
    ('Piton Capital', 'Investor / digital technology', 'https://www.pitoncapital.com/'),
    ('Puma Private Equity (Puma Investments)', 'Investor / UK growth capital', 'https://www.pumainvestments.co.uk/'),
    ('Scottish National Investment Bank', 'Public growth capital / UK technology', 'https://www.thebank.scot/')
  )
  insert into public.potential_meetings (organisation_id, institution_name, category, status, external_url, startup_visible_note, next_action, created_by)
  select jiro_id,
         target.institution_name,
         target.category,
         'draft'::public.potential_meeting_status,
         target.external_url,
         case
           when target.category like 'Advertising%' or target.category like 'Corporate VC / advertising%' then 'Potential agency, brand or advertising-technology relationship for Dropshot AI''s rights-cleared, brand-safe video production workflow.'
           when target.category like 'Corporate VC / media%' or target.category like 'Corporate VC / consumer%' or target.category like 'Corporate VC / creative%' then 'Potential strategic media, content, distribution or creative-technology relationship relevant to Dropshot AI''s European expansion.'
           when target.category like 'Public%' then 'Potential UK public-capital or growth-support route for a technology company scaling enterprise revenue and European operations.'
           when target.category like 'Investor%' or target.category like 'Growth%' or target.category like 'Corporate VC%' then 'Potential investor or strategic-capital relationship for Dropshot AI''s planned Series B and enterprise AI expansion.'
           else 'Potential ecosystem or investor relationship relevant to Dropshot AI''s European market entry.'
         end,
         case
           when target.category like 'Advertising%' then 'Request a warm introduction to a creative-technology, production or client-solutions lead and propose one tightly scoped pilot.'
           when target.category like 'Corporate VC%' then 'Qualify strategic fit, current mandate and relevant business unit before requesting an introduction.'
           when target.category like 'Public%' then 'Confirm eligibility and route; prepare a concise UK expansion, hiring and enterprise-revenue plan.'
           else 'Qualify stage, cheque size and current AI/creative-technology appetite before requesting a targeted introduction.'
         end,
         admin_id
  from targets target
  where not exists (
    select 1 from public.potential_meetings existing
    where existing.organisation_id = jiro_id
      and lower(trim(existing.institution_name)) = lower(trim(target.institution_name))
  );
end $$;
