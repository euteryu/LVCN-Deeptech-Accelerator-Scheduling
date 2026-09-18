-- Seoul Labs refresh from SVC London - Seoul Labs Schedule v7.xlsx and its application.
-- Adds the highest-fit October opportunities and a curated outreach board.
do $$
declare
  org_id uuid;
  admin_id uuid;
begin
  select id into org_id from public.organisations where slug = 'seoul-labs';
  select id into admin_id from public.profiles where role = 'lvnc_admin' order by created_at limit 1;
  if org_id is null then raise exception 'Seoul Labs organisation is missing.'; end if;
  if admin_id is null then raise exception 'No LVCN admin profile exists.'; end if;

  with meetings (institution_name, category, external_url, startup_visible_note, next_action) as (values
    ('FCA Innovation Hub', 'Regulatory / sandbox', 'https://www.fca.org.uk/firms/innovation', 'Best route for validating Seoul Labs'' KYC/AML-native fiat-token and regulated infrastructure proposition in the UK.', 'Request an Innovation Hub discussion and identify the relevant sandbox pathway.'),
    ('Bank of England Digital Securities Sandbox', 'Regulatory / market infrastructure', 'https://www.bankofengland.co.uk/financial-stability/digital-securities-sandbox', 'Potential fit for regulated digital-money, tokenisation and settlement conversations.', 'Ask for the appropriate DSB participant or innovation contact.'),
    ('Innovate Finance', 'Fintech ecosystem', 'https://www.innovatefinance.com/', 'High-value UK fintech network for payments, digital assets and policy introductions.', 'Request a member/introduction conversation focused on regulated stablecoin rails.'),
    ('Digital Catapult', 'Deep tech / public sector', 'https://www.digicatapult.org.uk/', 'Relevant bridge into UK government, identity, Web3 and trusted-infrastructure programmes.', 'Ask for a Web3 or digital identity programme introduction.'),
    ('Barclays', 'Bank / strategic partner', 'https://home.barclays/', 'Potential strategic partner for compliant payments, tokenisation and ASEAN financial inclusion use cases.', 'Seek innovation or digital-assets partnership contact.'),
    ('HSBC UK', 'Bank / strategic partner', 'https://www.hsbcinnovationbanking.com/uk', 'Potential enterprise and cross-border banking partner for fiat-pegged tokens and government rails.', 'Request an innovation-banking introduction.'),
    ('Visa Ventures', 'Payments / strategic investor', 'https://corporate.visa.com/en/about-visa/ventures.html', 'Strong fit for compliant payment infrastructure and wallet distribution partnerships.', 'Explore Visa innovation or Ventures referral route.'),
    ('Mastercard Start Path', 'Payments / accelerator', 'https://www.mastercard.com/global/en/business/industry-insights/start-path.html', 'Relevant global route for wallet, identity and regulated digital-asset infrastructure pilots.', 'Apply or request a Start Path referral.'),
    ('Illuminate Financial', 'Fintech investor', 'https://www.illuminatefinancial.com/', 'Specialist investor and network aligned with institutional fintech and market infrastructure.', 'Request a thesis-fit meeting and share XPHERE institutional use case.'),
    ('Anthemis', 'Fintech investor', 'https://www.anthemis.com/', 'Relevant fintech investor for inclusive finance, infrastructure and institutional adoption.', 'Request an investment fit conversation.'),
    ('Fabric Ventures', 'Web3 investor', 'https://www.fabric.vc/', 'Strong Web3 infrastructure fit for an EVM-compatible, compliance-oriented Layer-1.', 'Send a concise technical and regulatory investment brief.'),
    ('Outlier Ventures', 'Web3 accelerator / investor', 'https://outlierventures.io/', 'Useful accelerator and investor route for blockchain infrastructure and ecosystem growth.', 'Ask about accelerator or Base Camp fit.'),
    ('CoinFund', 'Web3 investor', 'https://coinfund.io/', 'Relevant crypto infrastructure investor with potential interest in compliant rails.', 'Request a partner referral for infrastructure review.'),
    ('British Patient Capital', 'UK growth investor', 'https://www.britishpatientcapital.co.uk/', 'Potential Series A/B ecosystem route for UK-linked institutional infrastructure scale-up.', 'Ask about eligible co-investment and UK market entry routes.'),
    ('Seedcamp', 'Early-stage investor', 'https://seedcamp.com/', 'Useful UK/European investor network for fintech and infrastructure introductions.', 'Request an appropriate fintech partner introduction.'),
    ('LocalGlobe / Latitude', 'UK investor', 'https://www.localglobe.vc/', 'Potential UK market-entry investor and founder network.', 'Share the Series A roadshow summary and request a fit check.'),
    ('Ripple Ventures', 'Web3 / payments investor', 'https://ripple.com/ventures/', 'Relevant strategic route for digital-asset payments and compliant blockchain infrastructure.', 'Request a strategic ecosystem conversation.'),
    ('Circle Ventures', 'Stablecoin / payments investor', 'https://www.circle.com/en/ventures', 'Highly relevant to fiat-pegged token architecture and regulated stablecoin distribution.', 'Request a partner or ecosystem conversation.'),
    ('Galaxy Ventures', 'Digital-assets investor', 'https://www.galaxy.com/ventures/', 'Potential institutional digital-assets investor and market-structure partner.', 'Request infrastructure thesis review.'),
    ('Schroders Capital', 'Institutional investor', 'https://www.schroders.com/en-gb/uk/asset-management/capabilities/private-assets/', 'Potential institutional perspective on digital assets, tokenisation and long-term infrastructure.', 'Seek the relevant digital-assets or private-assets innovation contact.')
  )
  insert into public.potential_meetings (organisation_id, institution_name, category, status, external_url, startup_visible_note, next_action, created_by)
  select org_id, institution_name, category, 'draft', external_url, startup_visible_note, next_action, admin_id
  from meetings m
  where not exists (select 1 from public.potential_meetings p where p.organisation_id = org_id and lower(trim(p.institution_name)) = lower(trim(m.institution_name)));
end $$;
