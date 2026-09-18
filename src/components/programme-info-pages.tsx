import { useState } from "react";
import { Building2, ExternalLink } from "lucide-react";
import { cn } from "../lib/utils";

export function OrganisersPage() {
  const links = [
    ["KISED", "https://www.kised.or.kr/_eng/", "Korea Institute of Startup & Entrepreneurship Development. Supports startup growth, entrepreneurship, commercialisation and global expansion."],
    ["PEN Ventures", "https://pen.ventures/", "Connects partners and supports innovative ideas as they launch and grow."],
    ["LVCN", "https://www.lvcn.co.uk/", "London Venture Capital Network connects founders, investors and the wider innovation ecosystem."],
    ["SVC Investor Showcase", "https://luma.com/koreavc", "A focused investor-facing programme moment for the participating SVC companies."],
  ];
  return (
    <div className="mx-auto max-w-6xl pb-8">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">SVC programme</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Investor Showcase</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Meet the organisations behind the programme and access the SVC Investor Showcase. Each link opens the relevant organisation or event in a new tab.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {links.map(([name, url, description], index) => (
          <a key={name} href={url} target="_blank" rel="noreferrer" className={cn("group flex min-h-52 flex-col rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)] transition hover:-translate-y-0.5 hover:shadow-md", index === links.length - 1 ? "border-indigo-300 bg-gradient-to-br from-indigo-700 to-[#162c5b] text-white" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50")}>
            <div className={cn("flex size-10 items-center justify-center rounded-xl", index === links.length - 1 ? "bg-white/15" : "bg-indigo-50 text-indigo-700")}><Building2 className="size-5" /></div>
            <p className="mt-5 font-semibold">{name}<ExternalLink className="ml-2 inline size-4 transition group-hover:translate-x-0.5" /></p>
            <p className={cn("mt-2 text-sm leading-6", index === links.length - 1 ? "text-indigo-100" : "text-slate-600")}>{description}</p>
            <span className={cn("mt-auto pt-5 text-xs font-bold", index === links.length - 1 ? "text-white" : "text-indigo-700")}>Open link</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function LocationPage() {
  const [copied, setCopied] = useState(false);
  const address = "77 Fulham Palace Road, The Foundry, London W6 8AF";
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Venue location</p>
      <h1 className="mt-1 text-3xl font-semibold">Hammersmith The Foundry</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Our programme base offers premium offices and coworking space close to Charing Cross Hospital and Hammersmith Town Hall, with Kings Mall and the Lyric Hammersmith nearby. It is a practical, collaborative base for the London programme.</p>
      <button onClick={() => { void navigator.clipboard.writeText(address); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }} className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-left font-semibold text-indigo-900">
        {address}<span className="mt-1 block text-xs font-medium text-indigo-600">{copied ? "Copied" : "Click to copy address"}</span>
      </button>
      <a href="https://www.spacesworks.com/en/gb/4699" target="_blank" rel="noreferrer" className="ml-3 inline-flex rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-100">Venue details <ExternalLink className="ml-2 size-4" /></a>
      <iframe title="Hammersmith The Foundry map" className="mt-6 h-[420px] w-full rounded-2xl border" src="https://www.google.com/maps?q=77%20Fulham%20Palace%20Road%20London%20W6%208AF&output=embed" />
    </div>
  );
}

const resourceCardStyles = [
  "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100",
  "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
  "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100",
];

function ResourceCards({ links }: { links: string[][] }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {links.map(([name, url, description], index) => (
        <a key={name} href={url} target="_blank" rel="noreferrer" className={cn("rounded-2xl border p-5 transition", resourceCardStyles[index % resourceCardStyles.length])}>
          <p className="font-semibold">{name}<ExternalLink className="ml-2 inline size-4" /></p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </a>
      ))}
    </div>
  );
}

export function ToiletMapPage() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Useful on the move</p>
      <h1 className="mt-1 text-3xl font-semibold">UK Toilet Map</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Find nearby public, community, and accessible toilets while travelling between programme events.</p>
      <ResourceCards links={[
        ["The Great British Public Toilet Map", "https://www.toiletmap.org.uk/", "Nationwide public and community toilet finder."],
        ["Spend a Penny", "https://www.spendapenny.uk/", "Nearby toilets with opening and accessibility information."],
        ["Where To Wee", "https://wheretowee.uk/free-public-toilets", "Free public conveniences and accessible facilities."],
      ]} />
    </div>
  );
}

export function ExternalEventsPage() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Discovery resources</p>
      <h1 className="mt-1 text-3xl font-semibold">External event links</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Useful sources for finding opportunities to review before adding them to the programme schedule.</p>
      <ResourceCards links={[
        ["Luma", "https://lu.ma/", "Founder, technology, and community events."],
        ["Partiful", "https://partiful.com/", "Community and social event discovery."],
        ["Meetup", "https://www.meetup.com/", "Local groups, founder meetups, and workshops."],
        ["CodeNode", "https://www.codenode.com/", "London technology-community events and workspace."],
        ["Entrepreneurs Collective", "https://www.entrepreneurscollective.biz/calendar/", "Founder, investor, and pitch events."],
        ["Eventbrite", "https://www.eventbrite.co.uk/", "Broad event and ticket listings."],
        ["Tech.eu", "https://tech.eu/events/", "European technology ecosystem events."],
      ]} />
    </div>
  );
}
