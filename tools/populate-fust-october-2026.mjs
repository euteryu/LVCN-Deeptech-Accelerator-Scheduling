import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1)];
  }),
);
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const fust = "22222222-2222-4222-8222-222222222222";
const call = async (path, options = {}, token = key) => {
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${body}`);
  return body ? JSON.parse(body) : null;
};

const meetings = [
  ["Spring Innovation", "12", "10:00", "Identify utility-backed pilot routes and relevant innovation calls."],
  ["British Water / Ofwat Innovation Fund", "12", "14:30", "Discuss innovation-fund routes and a PFAS / micropollutant consortium; invite a suitable technical lead."],
  ["Thames Water", "14", "10:00", "Explore a drinking-water or wastewater PFAS destruction pilot."],
  ["SUEZ UK", "14", "14:30", "Follow up completed PFAS sample testing with a commercial or pilot discussion."],
  ["Severn Trent", "15", "10:00", "Discuss an AMP8-relevant PFAS destruction pilot with innovation and water-quality teams."],
  ["Anglian Water", "15", "14:30", "Explore PFAS treatment use cases, pilot criteria and procurement route."],
  ["Yorkshire Water", "16", "10:00", "Assess appetite for a targeted PFAS destruction demonstration."],
  ["United Utilities", "16", "14:30", "Explore a North West PFAS demonstration and water-quality innovation needs."],
  ["Northumbrian Water", "19", "10:00", "Discuss PFAS priorities and a utility demonstration using chemical-free destruction."],
  ["Scottish Water", "19", "14:30", "Explore emerging PFAS destruction technology and evidence expectations."],
  ["UKWIR", "20", "10:00", "Identify collaborative research, evidence-generation and utility dissemination routes."],
  ["Environment Agency / Ofwat", "20", "14:30", "Regulatory-learning discussion on evidence expectations and permitting; not a procurement meeting."],
  ["Innovate UK", "21", "10:00", "Discuss UK funding, commercialisation support and a consortium pilot."],
  ["Environmental law specialist (firm TBC)", "21", "14:30", "Initial counsel on permitting, liability, product claims and commercial structure for UK pilots."],
  ["Zero Carbon Capital", "23", "09:30", "Series A discussion: scalable PFAS destruction, international validation and European expansion."],
  ["Systemiq Capital", "23", "10:30", "Investor discussion on water resilience, industrial decarbonisation and utility-scale deployment."],
  ["Clean Growth Fund", "23", "11:30", "Series A discussion on UK entry, pilot milestones and manufacturing opportunity."],
  ["Kiko Ventures", "23", "14:00", "Discuss technical defensibility, ultrasonic scale-up and the route to utility adoption."],
  ["PureTerra Ventures", "23", "15:00", "Water-specialist investor meeting on market entry, strategic partners and Series A fit."],
  ["Voyager Ventures", "23", "16:00", "Discuss environmental impact, international pilots and category leadership in PFAS destruction."],
  ["Emerald Technology Ventures", "23", "17:00", "Discuss industrial wastewater applications, strategic pilot partners and Series A fit."],
];
const makeIso = (day, time) => `2026-10-${day.padStart(2, "0")}T${time}:00+01:00`;
const endTime = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return `${String(hours + (minutes === 30 ? 1 : 0)).padStart(2, "0")}:${minutes === 30 ? "30" : "45"}`;
};
const items = [
  {
    title: "SUEZ Satellite User Forum - Smart Water & Wastewater",
    description: "SUEZ forum on smart water and wastewater technologies, utility case studies and peer discussions. High-signal route to UK water operators and a natural setting to advance FUST's existing SUEZ PFAS sample-testing relationship.",
    item_type: "third_party", starts_at: "2026-10-13T10:00:00+01:00", ends_at: "2026-10-13T20:00:00+01:00", location: "London - SEA LIFE London Aquarium / London Eye",
    event_url: "https://www.suez.com/en/uk/news/agenda/satellite-user-forum-2026", status: "confirmed", booking_status: "to_register", priority: "must_pursue",
    next_action: "Register interest with SUEZ; bring a one-page PFAS destruction validation brief.", source_note: "Confirmed by SUEZ: 13 October 2026, London.",
  },
  {
    title: "Women on Water Conference & Reception",
    description: "British Water water-sector conference and reception. Useful for introductions across water companies, supply chain, government and innovation partners; Manchester travel required.",
    item_type: "third_party", starts_at: "2026-10-22T13:00:00+01:00", ends_at: "2026-10-22T19:00:00+01:00", location: "Manchester - venue TBC",
    event_url: "https://www.britishwater.co.uk/page/WomenonWaterConferenceReception2026Speakers", status: "confirmed", booking_status: "to_register", priority: "strong_option",
    next_action: "Register through British Water and schedule Manchester travel; prioritise utility and supply-chain introductions.", source_note: "Confirmed by British Water: 22 October 2026, 13:00-19:00, Manchester.",
  },
  {
    title: "Chemical Reactions: UK Chemicals Conference - PFAS policy and regulation",
    description: "Chemical Industries Association and Steptoe conference covering UK REACH, GB CLP and a dedicated PFAS policy and regulation session, followed by a networking reception. High-value regulatory and industry intelligence for UK PFAS market entry.",
    item_type: "third_party", starts_at: "2026-10-20T09:00:00+01:00", ends_at: "2026-10-20T19:00:00+01:00", location: "Hyatt Regency Manchester, 55 Booth Street West, Manchester M15 6PQ",
    event_url: "https://cia-online.org.uk/Training-and-events/Training-courses/Event-Details/eventDateId/4823", status: "confirmed", booking_status: "to_register", priority: "must_pursue",
    next_action: "Register early (£50 plus VAT); prepare concise questions on PFAS policy, UK REACH and pilot permitting.", source_note: "Confirmed by Chemical Industries Association: 20 October 2026, 09:00-19:00, Manchester.",
  },
  {
    title: "Cambridge Cleantech Climate Tech Club - October 2026",
    description: "Cambridge Cleantech, Carbon13 and Barclays Eagle Labs networking for climate-tech founders, investors, corporates and enablers. Strong opportunity to find commercial and investor introductions relevant to industrial water and PFAS remediation.",
    item_type: "third_party", starts_at: "2026-10-19T16:00:00+01:00", ends_at: "2026-10-19T18:00:00+01:00", location: "St John's Innovation Centre, Cambridge",
    event_url: "https://www.cambridgecleantech.org.uk/our-events", status: "confirmed", booking_status: "to_register", priority: "strong_option",
    next_action: "Register free; request introductions to water, industrial and climate-investment participants.", source_note: "Confirmed by Cambridge Cleantech: 19 October 2026; event listing gives 16:00-18:00 at St John's Innovation Centre.",
  },
  {
    title: "Climate Tech Time - October gathering",
    description: "Monthly UK climate-tech gathering bringing together VCs, angels, founders and climate operators. Use for targeted follow-up conversations, not as a substitute for a scheduled investor meeting.",
    item_type: "third_party", starts_at: "2026-10-21T00:00:00+01:00", ends_at: "2026-10-21T23:59:00+01:00", time_precision: "all_day", location: "London - venue and time to confirm",
    event_url: "https://sustainable.fractionalcmo.uk/sustainability-events/", status: "confirmed", booking_status: "details_to_verify", priority: "strong_option",
    next_action: "Verify venue, time and registration; request introductions only to water/climate investors with relevant mandates.", source_note: "21 October 2026 date is published; venue and time require confirmation.",
  },
  ...meetings.map(([target, day, time, focus]) => ({
    title: `${target} - FUST Lab introduction`,
    description: `${focus} FUST will position CAVITOX as a focused-ultrasonic, chemical-free PFAS destruction system with no secondary waste.`,
    item_type: "business_meeting", starts_at: makeIso(day, time), ends_at: makeIso(day, endTime(time)), location: "UK - TBC",
    event_url: null, status: "proposed", booking_status: "to_arrange", priority: "must_pursue",
    next_action: "Outreach initiated; confirm the right attendee and send a tailored CAVITOX evidence brief in advance.", source_note: "Targeted for FUST's confirmed UK visit window, 12-23 October 2026. Meeting not yet confirmed.",
  })),
  ...[
    ["Veolia UK - PFAS pilot pathway", "Advance FUST's planned Veolia sample testing into a UK pilot or validation pathway, with a clear technical protocol and commercial decision gate.", "Existing technical engagement; date and attendee to confirm."],
    ["Xylem UK - treatment integration and channel partnership", "Assess whether CAVITOX can be integrated, distributed or piloted through Xylem's water-treatment and utility channels.", "Target partner identified; outreach and date to confirm."],
    ["Nijhuis Saur Industries UK - industrial wastewater pilot", "Explore a pilot for industrial PFAS-contaminated wastewater, including pre-treatment, flow profile and deployment requirements.", "Target partner identified; outreach and date to confirm."],
    ["RSK Environment - contaminated land and groundwater pilot", "Identify contaminated-land or groundwater remediation projects where direct PFAS destruction could be demonstrated with an environmental-services partner.", "Target partner identified; outreach and date to confirm."],
    ["Wessex Water - PFAS treatment pilot", "Explore a utility proof-of-concept around PFAS destruction, water-quality evidence and pilot-site selection.", "Target utility identified; outreach and date to confirm."],
    ["Southern Water - PFAS treatment pilot", "Discuss operational requirements and a potential proof-of-concept for direct PFAS destruction in Southern Water's network.", "Target utility identified; outreach and date to confirm."],
    ["Dwr Cymru Welsh Water - PFAS treatment pilot", "Explore a Welsh utility proof-of-concept and evidence pathway for chemical-free PFAS destruction.", "Target utility identified; outreach and date to confirm."],
    ["Adler and Allan - PFAS remediation pilot", "Assess PFAS-contaminated-site and firefighting-foam remediation opportunities where CAVITOX can provide the destruction stage.", "Target remediation partner identified; outreach and date to confirm."],
  ].map(([target, focus, source_note]) => ({
    title: `${target} - FUST Lab introduction`, description: `${focus} FUST will position CAVITOX as focused-ultrasonic, chemical-free PFAS destruction with no secondary waste.`,
    item_type: "business_meeting", starts_at: null, ends_at: null, location: "Date and location to confirm", event_url: null, status: "proposed", booking_status: "to_arrange", priority: "must_pursue",
    next_action: "Identify the right innovation, water-quality or remediation lead; secure a discovery call before proposing an on-site pilot.", source_note,
  })),
];

const auth = await call("/auth/v1/signup", { method: "POST", body: JSON.stringify({ data: {}, gotrue_meta_security: {} }) });
const profile = await call("/rest/v1/rpc/claim_quick_access", { method: "POST", body: JSON.stringify({ access_email: "minseok@lvcn.co.uk" }) }, auth.access_token);
if (profile?.[0]?.role !== "lvnc_admin") throw new Error("Could not claim LVCN admin access");
const existing = await call(`/rest/v1/schedule_items?select=id,title,schedule_item_organisations(organisation_id)&schedule_item_organisations.organisation_id=eq.${fust}`, {}, auth.access_token);
const newItems = items.filter((item) => !existing.some((entry) => entry.title === item.title)).map((item) => ({
  ...item, visibility_scope: "selected_organisations", attendance_rule: item.item_type === "business_meeting" ? "recommended" : "optional",
  time_precision: item.time_precision ?? (item.starts_at ? "exact" : "unknown"), cost_type: "unknown", fit: "High fit: PFAS destruction for utilities and industrial water treatment; strategic water-sector or climate-scale-up opportunity.", created_by: profile[0].id,
}));
const inserted = newItems.length ? await call("/rest/v1/schedule_items", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(newItems) }, auth.access_token) : [];
if (inserted.length) await call("/rest/v1/schedule_item_organisations", { method: "POST", body: JSON.stringify(inserted.map(({ id }) => ({ schedule_item_id: id, organisation_id: fust }))) }, auth.access_token);
// Investor outreach, unconfirmed counsel, and the regulator conversation do not have appointment slots.
// Clear their placeholders so the board groups them beneath "Date to confirm".
for (const title of [
  "Zero Carbon Capital - FUST Lab introduction", "Systemiq Capital - FUST Lab introduction", "Clean Growth Fund - FUST Lab introduction",
  "Kiko Ventures - FUST Lab introduction", "PureTerra Ventures - FUST Lab introduction", "Voyager Ventures - FUST Lab introduction",
  "Emerald Technology Ventures - FUST Lab introduction", "Environmental law specialist (firm TBC) - FUST Lab introduction",
  "Environment Agency / Ofwat - FUST Lab introduction",
]) await call(`/rest/v1/schedule_items?title=eq.${encodeURIComponent(title)}`, {
  method: "PATCH", headers: { Prefer: "return=minimal" },
  body: JSON.stringify({ starts_at: null, ends_at: null, time_precision: "unknown", location: "Date and location to confirm", source_note: "Target identified; outreach or response confirmation required. Date to confirm." }),
}, auth.access_token);
await call(`/rest/v1/schedule_items?title=eq.${encodeURIComponent("Climate Tech Time - October gathering")}`, {
  method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ time_precision: "all_day" }),
}, auth.access_token);
const verification = await call(`/rest/v1/schedule_items?select=id,title,item_type,status,starts_at,schedule_item_organisations!inner(organisation_id)&schedule_item_organisations.organisation_id=eq.${fust}`, {}, auth.access_token);
console.log(JSON.stringify({ added: inserted.length, total: verification.length, byType: Object.groupBy(verification, ({ item_type }) => item_type) }, null, 2));
