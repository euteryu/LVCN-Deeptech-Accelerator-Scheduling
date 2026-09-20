import { format, formatDistanceToNow } from "date-fns";
import { Activity, ChevronDown, Clock3, RotateCcw, Users } from "lucide-react";
import type {
  EngagementAccessEvent,
  EngagementIdentity,
  EngagementInvite,
} from "../types";
import { buildEngagementSummary } from "../lib/engagement";
import { cn } from "../lib/utils";

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cooling: "bg-amber-50 text-amber-700 ring-amber-200",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  never: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function AdminEngagementPanel({
  events,
  baselineAt,
  identities,
  invites,
  organisationNames,
  onReset,
}: {
  events: EngagementAccessEvent[];
  baselineAt?: string;
  identities: EngagementIdentity[];
  invites: EngagementInvite[];
  organisationNames: Record<string, string>;
  onReset: () => void;
}) {
  const currentEvents = baselineAt ? events.filter((event) => event.occurredAt >= baselineAt) : events;
  const companies = buildEngagementSummary(currentEvents, identities, invites, organisationNames);
  const users = companies.flatMap((company) => company.users);
  const accessCount = users.reduce((total, user) => total + user.accessCount, 0);
  const activeUsers = users.filter((user) => user.status === "active").length;
  const returningUsers = users.filter((user) => user.activeDays >= 2).length;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-[#162c5b] to-indigo-800 p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-indigo-200">Engagement and retention</p>
            <h2 className="mt-1 text-xl font-semibold">Who is using the programme board?</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-indigo-100">An access is recorded when an invited participant opens the app. Repeat browser profiles are combined by email address.{baselineAt && <> This reporting period began {format(new Date(baselineAt), "d MMM yyyy, HH:mm")}.</>}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2"><div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-indigo-50"><Activity className="size-4" /> Live usage record</div><button type="button" onClick={() => { if (window.confirm("Reset engagement reporting from now? Historical access records are retained, but all current dashboard counts will restart.")) onReset(); }} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">Reset tracking from now</button></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric icon={Activity} value={accessCount} label="Recorded app opens" />
          <Metric icon={Users} value={activeUsers} label="Users active in 7 days" />
          <Metric icon={RotateCcw} value={returningUsers} label="Users returning on 2+ days" />
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {companies.map((company, index) => {
          const maxDaily = Math.max(1, ...company.dailyAccesses.map((day) => day.count));
          return (
            <details key={company.organisationId} open={index < 3} className="group p-4 sm:p-5">
              <summary className="flex cursor-pointer list-none flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="size-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                    <h3 className="truncate font-semibold text-slate-900">{company.organisationName}</h3>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-slate-500">
                    {company.activeUsers} of {company.users.length} invited user{company.users.length === 1 ? "" : "s"} active recently
                    {company.lastAccess && <> · last opened {formatDistanceToNow(new Date(company.lastAccess), { addSuffix: true })}</>}
                  </p>
                </div>
                <div className="flex items-end gap-1" aria-label="App opens over the last 14 days">
                  {company.dailyAccesses.map((day) => (
                    <span key={day.date} title={`${format(new Date(`${day.date}T12:00:00Z`), "d MMM")}: ${day.count} opens`} className={cn("block w-2 rounded-sm", day.count ? "bg-indigo-500" : "bg-slate-100")} style={{ height: `${Math.max(4, (day.count / maxDaily) * 28)}px` }} />
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-600">{company.accessCount}</span>
                </div>
              </summary>
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">
                    <tr><th className="px-3 py-2.5">User</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 text-right">Total opens</th><th className="px-3 py-2.5 text-right">Active days</th><th className="px-3 py-2.5 text-right">Last 7 days</th><th className="px-3 py-2.5">Last opened</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {company.users.map((user) => (
                      <tr key={user.email} className="hover:bg-slate-50/70">
                        <td className="px-3 py-3"><p className="font-semibold text-slate-900">{user.fullName || user.email}</p>{user.fullName && <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>}</td>
                        <td className="px-3 py-3"><span className={cn("inline-flex rounded-full px-2 py-1 text-[10px] font-bold capitalize ring-1 ring-inset", statusStyles[user.status])}>{user.status}</span></td>
                        <td className="px-3 py-3 text-right font-bold text-slate-800">{user.accessCount}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{user.activeDays}</td>
                        <td className="px-3 py-3 text-right"><span className={cn("font-bold", user.accesses7d > user.previous7d ? "text-emerald-700" : user.accesses7d < user.previous7d ? "text-amber-700" : "text-slate-600")}>{user.accesses7d}</span><span className="ml-1 text-[10px] text-slate-400">prev {user.previous7d}</span></td>
                        <td className="px-3 py-3 text-xs text-slate-500">{user.lastAccess ? <><span className="font-semibold text-slate-700">{formatDistanceToNow(new Date(user.lastAccess), { addSuffix: true })}</span><span className="mt-0.5 block">{format(new Date(user.lastAccess), "d MMM yyyy, HH:mm")}</span></> : "Never opened"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
        {!companies.length && <div className="p-8 text-center text-sm text-slate-500"><Clock3 className="mx-auto mb-2 size-5" />No participant access has been recorded yet.</div>}
      </div>
    </section>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Activity; value: number; label: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur"><div className="flex items-center gap-2"><Icon className="size-4 text-indigo-200" /><p className="text-2xl font-bold">{value}</p></div><p className="mt-1 text-xs font-medium text-indigo-100">{label}</p></div>;
}
